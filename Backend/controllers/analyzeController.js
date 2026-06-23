import fs from "fs/promises";
import Check from "../models/Check.js";
import { verifyClaim } from "./factCheckController.js";
import {
  detectAIContent,
  detectAndTranslate,
  extractClaims,
} from "../utils/genai.js";
import { extractTextFromImage } from "../utils/ocr.js";
import { scrapeArticleFromUrl } from "../utils/scraper.js";
import {
  calculateTrustScore,
  getDomainCredibility,
} from "../utils/scoring.js";
import { generateHash, getFromCache, setCache } from "../utils/cache.js";

const ANALYSIS_TIMEOUT_MS = 60_000;
const DEFAULT_SOURCE_CREDIBILITY = 60;
const DEFAULT_AI_LIKELIHOOD = 50;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Analysis timed out after 60 seconds")),
        ms
      );
    }),
  ]);

const safeStep = async (label, fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
    return fallback;
  }
};

const resolveInputText = async (type, content, file) => {
  if (type === "text") {
    if (!content?.trim()) {
      throw new Error("Content is required for type 'text'");
    }
    return content.trim();
  }

  if (type === "url") {
    if (!content?.trim()) {
      throw new Error("Content URL is required for type 'url'");
    }
    return scrapeArticleFromUrl(content.trim());
  }

  if (type === "image") {
    if (!file?.path) {
      throw new Error("Image file is required for type 'image'");
    }
    try {
      return await extractTextFromImage(file.path);
    } finally {
      await fs.unlink(file.path).catch((error) => {
        console.warn(`Failed to delete uploaded image: ${error.message}`);
      });
    }
  }

  throw new Error('Invalid type. Must be "text", "url", or "image"');
};

const runAnalysis = async (req) => {
  const type = req.body.type;
  const content = req.body.content;
  const inputUrl = type === "url" ? content?.trim() : null;

  const rawText = await resolveInputText(type, content, req.file);
  if (!rawText) {
    throw new Error("No text could be extracted from the provided input");
  }

  // ── OCR coherence check ─────────────────────────────────────────────────────
  // If the image has no real text (pure visual / AI-generated artwork), Tesseract
  // returns pixel noise that looks like random characters. Detect this by measuring
  // the ratio of alphanumeric characters in the extracted text.
  // Threshold: if < 40% of non-whitespace chars are alphanumeric → treat as image-only.
  let isGarbledOcr = false;
  if (type === "image") {
    const stripped = rawText.replace(/\s+/g, "");
    if (stripped.length > 0) {
      const alphaNum = stripped.replace(/[^a-zA-Z0-9]/g, "").length;
      const ratio = alphaNum / stripped.length;
      if (ratio < 0.40 || stripped.length < 20) {
        isGarbledOcr = true;
        console.log(`[OCR] Garbled output detected (ratio=${ratio.toFixed(2)}, len=${stripped.length}). Treating as visual image.`);
      }
    } else {
      isGarbledOcr = true;
    }
  }

  // Track whether real AI analysis succeeded or fell back to defaults
  let apiWorking = true;

  const { language, translatedText } = await safeStep(
    "detectAndTranslate",
    () => detectAndTranslate(rawText),
    { language: "unknown", translatedText: rawText }
  );

  // Skip claim extraction entirely for garbled OCR (pure visual images)
  const extractedClaims = isGarbledOcr
    ? []
    : await safeStep(
        "extractClaims",
        () => extractClaims(translatedText),
        []
      );

  const claimsToVerify = isGarbledOcr
    ? [] // no claims for visual-only images
    : extractedClaims.length > 0
      ? extractedClaims
      : translatedText.trim().split(/\s+/).length >= 4
        ? [{ claim: translatedText.trim() }]
        : [];

  const verifiedClaims = await Promise.all(
    claimsToVerify.map(async (item) => {
      const claimText = item.claim;
      return safeStep(
        `verifyClaim("${claimText}")`,
        () => verifyClaim(claimText),
        {
          claim: claimText,
          verdict: "Unverified",
          reasoning: "Verification unavailable due to an upstream error",
          sources: [],
        }
      );
    })
  );

  // For visual images with no readable text, use the raw OCR output for AI detection
  // but fall back to a descriptive message so the UI shows something useful
  const aiDetectionText = isGarbledOcr
    ? rawText.length > 10 ? rawText : "Visual image with no extractable text"
    : translatedText;

  const aiResult = await safeStep(
    "detectAIContent",
    () => detectAIContent(aiDetectionText),
    null
  );

  // null means AI detection failed → mark API as not working
  const aiLikelihood = aiResult?.aiLikelihood ?? DEFAULT_AI_LIKELIHOOD;
  const aiReasoning = isGarbledOcr && !aiResult
    ? "This appears to be a purely visual image with no readable text. AI content analysis was run on the pixel-extracted data."
    : (aiResult?.reasoning ?? "AI detection unavailable. Please check your AI provider API key.");
  if (!aiResult) apiWorking = false;

  const sourceCredibility = inputUrl
    ? await safeStep(
        "getDomainCredibility",
        () => getDomainCredibility(inputUrl),
        DEFAULT_SOURCE_CREDIBILITY
      )
    : DEFAULT_SOURCE_CREDIBILITY;

  let trustScore = DEFAULT_SOURCE_CREDIBILITY;
  let aiScore = 100 - aiLikelihood;
  let sourceScore = sourceCredibility;

  if (verifiedClaims.length > 0) {
    const scores = calculateTrustScore(
      verifiedClaims,
      aiLikelihood,
      sourceCredibility
    );
    trustScore = scores.trustScore;
    aiScore = scores.aiScore;
    sourceScore = scores.sourceScore;
  } else {
    trustScore = Math.round(
      aiScore * 0.25 + sourceScore * 0.25 + 50 * 0.5
    );
  }

  const claimsForResponse = verifiedClaims.map(
    ({ claim, verdict, confidence, reasoning, sources, sourceCount, trustedSourceCount }) => ({
      text: claim,
      verdict,
      confidence,
      reasoning: isGarbledOcr && !reasoning
        ? "No readable text was found in this image. The image appears to be a pure visual with no embedded text."
        : reasoning,
      sources,
      sourceCount,
      trustedSourceCount,
    })
  );

  let checkId = null;
  try {
    const check = await Check.create({
      userId: req.user?._id ?? null,
      inputType: type,
      originalText: rawText,
      language,
      claims: verifiedClaims.map(({ claim, verdict, sources }) => ({
        text: claim,
        verdict,
        sources: sources.map((source) => source.url),
      })),
      aiScore,
      sourceScore,
      trustScore,
    });
    checkId = check._id;
  } catch (dbError) {
    console.warn(`[DB] Failed to save check result: ${dbError.message}`);
    console.warn("[DB] Analysis results will still be returned to client.");
  }

  return {
    inputType: type,
    language,
    claims: claimsForResponse,
    aiLikelihood,
    aiReasoning,
    aiScore,
    sourceCredibility,
    trustScore,
    checkId,
    apiWorking,  // false when the AI provider key is invalid/missing and scores use fallback defaults
  };
};

export const analyze = async (req, res) => {
  try {
    const type = req.body.type;

    if (!type || !["text", "url", "image"].includes(type)) {
      return res.status(400).json({
        message: 'Invalid or missing type. Must be "text", "url", or "image"',
      });
    }

    // Generate cache key based on input content
    const content = req.body.content || "";
    const cacheKey = generateHash(`${type}:${content}`);

    // Check cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log(`[${new Date().toISOString()}] Cache hit for analyze request`);
      return res.status(200).json(cachedResult);
    }

    console.log(`[${new Date().toISOString()}] Cache miss for analyze request, running analysis`);

    const result = await withTimeout(runAnalysis(req), ANALYSIS_TIMEOUT_MS);

    // Cache the result
    setCache(cacheKey, result);
    console.log(`[${new Date().toISOString()}] Analysis result cached with key: ${cacheKey}`);

    res.status(200).json(result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Analyze request failed:`, error.message);

    if (error.message.includes("timed out")) {
      return res.status(504).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: error.message || "Analysis failed",
    });
  }
};
