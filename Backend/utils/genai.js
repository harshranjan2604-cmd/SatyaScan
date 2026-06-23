import { Mistral } from "@mistralai/mistralai";
import { getFallback } from "./fallbacks.js";

// Model to use — mistral-small-latest is fast, capable, and on the free tier
const MODEL_NAME = "mistral-small-latest";

// Returns the Mistral API key.
// Set MISTRAL_API_KEY in .env — get a free key at https://console.mistral.ai/api-keys/
const getApiKey = () => {
  const key = process.env.MISTRAL_API_KEY;
  if (key) {
    console.log("[genai] Using MISTRAL_API_KEY");
    return key;
  }
  return null;
};

// ── Core Mistral caller with retry ────────────────────────────────────────────

const callMistral = async (systemPrompt, userContent, functionName) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "No Mistral API key found. Set MISTRAL_API_KEY in .env.\n" +
      "Get a free key from: https://console.mistral.ai/api-keys/"
    );
  }

  const client = new Mistral({ apiKey });
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.complete({
        model: MODEL_NAME,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) throw new Error("Mistral returned empty response");
      return text;
    } catch (err) {
      lastError = err;
      console.error(
        `[${new Date().toISOString()}] ${functionName} attempt ${attempt}/3 failed: ${err.message}`
      );
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }

  throw lastError;
};

// ── JSON helpers ──────────────────────────────────────────────────────────────

const stripFences = (text) => {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  }
  return s.trim();
};

const parseJson = (text, ctx) => {
  try {
    return JSON.parse(stripFences(text));
  } catch (e) {
    throw new Error(`Failed to parse ${ctx} response as JSON: ${e.message}`);
  }
};

// ── Exported functions ────────────────────────────────────────────────────────

export const extractClaims = async (text) => {
  if (!text?.trim()) throw new Error("Text is required");

  const system = `You extract factual claims from articles for fact-checking.
Identify 1 to 7 distinct, specific, checkable factual claims. If the input is a single checkable factual sentence, return it as one claim.
Each must be a standalone statement verifiable against external sources.
Do NOT include opinions, predictions, questions, commands, or vague statements.
Respond ONLY with a valid JSON array, no other text:
[{ "claim": "..." }]`;

  try {
    const raw = await callMistral(system, text, "extractClaims");
    const parsed = parseJson(raw, "claim extraction");
    if (!Array.isArray(parsed)) throw new Error("Must be JSON array");
    for (const item of parsed) {
      if (!item?.claim || typeof item.claim !== "string")
        throw new Error('Each item must have a "claim" string field');
    }
    return parsed;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] extractClaims failed: ${err.message}`);
    return getFallback("extractClaims");
  }
};

export const detectAndTranslate = async (text) => {
  if (!text?.trim()) throw new Error("Text is required");

  const system = `Detect the language of the text and translate to English if needed.
Rules:
- Detect the ISO 639-1 language code (e.g. "en", "hi", "es").
- If already English, set translatedText to the original text unchanged.
- If not English, provide an accurate English translation.
Respond ONLY with valid JSON, no other text:
{ "language": "hi", "translatedText": "..." }`;

  try {
    const raw = await callMistral(system, text, "detectAndTranslate");
    const parsed = parseJson(raw, "language detection");
    if (!parsed?.language || !parsed?.translatedText)
      throw new Error("Missing language or translatedText");
    return { language: parsed.language.toLowerCase(), translatedText: parsed.translatedText };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] detectAndTranslate failed: ${err.message}`);
    return getFallback("detectAndTranslate");
  }
};

export const compareClaimWithSources = async (claim, sources) => {
  if (!claim?.trim()) throw new Error("Claim is required");

  const system = `You are a fact-checking assistant with access to the supplied sources below. Use them as your primary evidence.

VERDICT RULES — apply in this order:

────────────────────────────────────────────
"Supported"
────────────────────────────────────────────
A supplied source directly and clearly confirms that the claim is true.

────────────────────────────────────────────
"Contradicted"
────────────────────────────────────────────
Use "Contradicted" when EITHER condition is met using supplied sources:

  1. DIRECT contradiction:
     A source explicitly states the opposite of the claim.
     Example: Claim = "India won the 2022 FIFA World Cup"
              Source: "Argentina won the 2022 FIFA World Cup" → Contradicted

  2. LOGICAL contradiction:
     A source provides authoritative facts that make the claim factually impossible,
     even if it does not use the exact same words.
     Example: Claim = "The Moon is made of cheese."
              Source: "The Moon is composed primarily of silicate rock and metal." → Contradicted
     Example: Claim = "Water boils at 50 degrees C at sea level."
              Source: "Water boils at 100 degrees C at standard atmospheric pressure." → Contradicted

  Key test: Could a reasonable person conclude from the source's facts alone
  that the claim is false? If yes, use Contradicted.

────────────────────────────────────────────
"Unverified"
────────────────────────────────────────────
Use ONLY when supplied sources have no meaningful bearing on the claim:
  - No sources supplied
  - Sources discuss a related but different topic and cannot confirm or deny the claim
  - Sources are too vague or general to draw any conclusion
  Example: Claim = "Aliens secretly built the pyramids."
           Sources discuss pyramid architecture but say nothing about alien involvement → Unverified

────────────────────────────────────────────
CONFIDENCE SCORING (integer 0-100):
────────────────────────────────────────────
Supported:
  - Multiple trusted sources (reuters, bbc, nasa, wikipedia etc.) explicitly support → 90-100
  - One trusted source supports → 75-89
  - Only lower-credibility sources support → 55-74

Contradicted:
  - Multiple trusted sources contradict (directly or logically) → 90-100
  - One trusted source contradicts (directly or logically) → 75-89
  - Only lower-credibility sources contradict → 55-74

Unverified:
  - No sources supplied at all → 0-20
  - Sources exist but are weak or unrelated → 20-50

Keep reasoning to 1-3 sentences. State which source led to your verdict (by title or publisher).
Respond ONLY with valid JSON, no other text:
{ "verdict": "Supported" | "Contradicted" | "Unverified", "confidence": 80, "reasoning": "..." }`;

  try {
    const raw = await callMistral(
      system,
      JSON.stringify({ claim, sources }, null, 2),
      "compareClaimWithSources"
    );
    const parsed = parseJson(raw, "claim comparison");
    const validVerdicts = ["Supported", "Contradicted", "Unverified"];
    if (!parsed?.reasoning || !validVerdicts.includes(parsed?.verdict))
      throw new Error("Invalid verdict or missing reasoning");

    // Validate confidence — clamp to 0-100, default 50 if missing/invalid
    const confidence =
      typeof parsed.confidence === "number" &&
      parsed.confidence >= 0 &&
      parsed.confidence <= 100
        ? Math.round(parsed.confidence)
        : 50;

    return { verdict: parsed.verdict, confidence, reasoning: parsed.reasoning };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] compareClaimWithSources failed: ${err.message}`);
    return getFallback("compareClaimWithSources");
  }
};

export const detectAIContent = async (text) => {
  if (!text?.trim()) throw new Error("Text is required");

  const system = `Analyze text for patterns associated with AI-generated writing.
Look for: repetitiveness, generic/vague language, uniform sentence structure, formulaic transitions, lack of personal voice.
Note: this is a heuristic estimate, not definitive.
Respond ONLY with valid JSON, no other text:
{ "aiLikelihood": 75, "reasoning": "short plain-English explanation" }
aiLikelihood must be an integer 0-100. 0 = very likely human, 100 = very likely AI.`;

  try {
    const raw = await callMistral(system, text, "detectAIContent");
    const parsed = parseJson(raw, "AI detection");
    if (
      typeof parsed?.aiLikelihood !== "number" ||
      parsed.aiLikelihood < 0 ||
      parsed.aiLikelihood > 100
    )
      throw new Error("aiLikelihood must be 0-100");
    if (typeof parsed?.reasoning !== "string") throw new Error("Missing reasoning");
    return { aiLikelihood: Math.round(parsed.aiLikelihood), reasoning: parsed.reasoning };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] detectAIContent failed: ${err.message}`);
    return getFallback("detectAIContent");
  }
};
