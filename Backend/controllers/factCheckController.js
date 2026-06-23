import { compareClaimWithSources } from "../utils/genai.js";

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const FACT_CHECK_API_URL =
  "https://factchecktools.googleapis.com/v1alpha1/claims:search";
const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";

const MAX_SOURCES = 8;
// Raised from 0.22 — eliminates weakly related articles before sending to LLM
const MIN_RELEVANCE = 0.30;

const TRUSTED_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "npr.org",
  "pbs.org",
  "thehindu.com",
  "ndtv.com",
  "snopes.com",
  "politifact.com",
  "factcheck.org",
  "fullfact.org",
  "wikipedia.org",
  "britannica.com",
  "who.int",
  "nasa.gov",
  "gov.in",
  "un.org",
];

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "were",
  "will",
  "with",
]);

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const getHostname = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

const isTrustedDomain = (url) => {
  const hostname = getHostname(url);
  return TRUSTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
};

const buildNewsQuery = (claim) => {
  const keywords = [...new Set(tokenize(claim))].slice(0, 8);
  if (keywords.length < 2) return claim;

  const compactClaim = claim.replace(/\s+/g, " ").trim();
  const phrase = compactClaim.length <= 120 ? `"${compactClaim}"` : "";
  const keywordQuery = keywords.join(" AND ");

  return phrase ? `${phrase} OR (${keywordQuery})` : keywordQuery;
};

const inferSubject = (claim) => {
  const match = claim
    .replace(/\s+/g, " ")
    .trim()
    .match(/^(.+?)\s+(is|are|was|were|has|have|had|made|located|completed|won|claims?|says?)\b/i);

  if (!match) return null;

  const subject = match[1].replace(/^(the|a|an)\s+/i, "").trim();
  if (!subject || subject.split(" ").length > 6) return null;
  return subject;
};

const scoreSourceRelevance = (claim, source) => {
  const claimTokens = [...new Set(tokenize(claim))];
  if (claimTokens.length === 0) return 0;

  const sourceText = `${source.title || ""} ${source.snippet || ""} ${source.source || ""}`;
  const sourceTokens = new Set(tokenize(sourceText));
  const matched = claimTokens.filter((token) => sourceTokens.has(token)).length;
  const overlap = matched / claimTokens.length;

  const typeBonus = source.type === "fact-check" ? 0.2 : source.type === "reference" ? 0.12 : 0;
  // Increased trusted bonus — preferred domains (nasa.gov, wikipedia, bbc etc.) rank significantly higher
  const trustedBonus = isTrustedDomain(source.url) ? 0.15 : 0;

  return Math.min(1, overlap + typeBonus + trustedBonus);
};

const enrichAndRankSources = (claim, sources) =>
  dedupeSources(sources)
    .map((source) => ({
      ...source,
      relevance: scoreSourceRelevance(claim, source),
      trusted: isTrustedDomain(source.url),
    }))
    .filter((source) => {
      // Fact-check sources always pass through (they're directly about the claim)
      if (source.type === "fact-check") return true;
      // Trusted domains get a lower effective threshold — we trust their relevance more
      if (source.trusted) return source.relevance >= MIN_RELEVANCE - 0.08;
      // All others must meet the full threshold
      return source.relevance >= MIN_RELEVANCE;
    })
    .sort((a, b) => {
      // Trusted domains first, then by relevance score
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return b.relevance - a.relevance;
    })
    .slice(0, MAX_SOURCES);

const fetchNewsSources = async (claim) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn("NEWS_API_KEY is not configured; skipping NewsAPI lookup");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: buildNewsQuery(claim),
      pageSize: "20",
      sortBy: "relevancy",
      language: "en",
      searchIn: "title,description,content",
      apiKey,
    });

    const response = await fetch(`${NEWS_API_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`NewsAPI error (${response.status}): ${errorBody}`);
      return [];
    }

    const data = await response.json();
    return (data.articles || [])
      .filter((article) => article.title && article.url)
      .map((article) => ({
        title: article.title,
        url: article.url,
        source: article.source?.name || getHostname(article.url) || "News source",
        snippet: article.description || article.content || "",
        publishedAt: article.publishedAt,
        type: "news",
      }));
  } catch (error) {
    console.warn(`NewsAPI request failed: ${error.message}`);
    return [];
  }
};

const fetchFactCheckSources = async (claim) => {
  const apiKey = process.env.FACT_CHECK_API_KEY;
  if (!apiKey) {
    console.warn(
      "FACT_CHECK_API_KEY is not configured; skipping Fact Check API lookup"
    );
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: claim,
      key: apiKey,
    });

    const response = await fetch(`${FACT_CHECK_API_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`Fact Check API error (${response.status}): ${errorBody}`);
      return [];
    }

    const data = await response.json();
    const sources = [];

    for (const item of data.claims || []) {
      for (const review of item.claimReview || []) {
        if (!review.url) continue;

        sources.push({
          title: review.title || item.text || claim,
          url: review.url,
          source: review.publisher?.name || "Fact Check",
          snippet: [item.text, review.textualRating].filter(Boolean).join(" Verdict: "),
          type: "fact-check",
        });
      }
    }

    return sources;
  } catch (error) {
    console.warn(`Fact Check API request failed: ${error.message}`);
    return [];
  }
};

const fetchWikipediaSource = async (claim) => {
  const subject = inferSubject(claim);
  if (!subject) return [];

  try {
    const response = await fetch(
      `${WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(subject)}`,
      { headers: { accept: "application/json" } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data?.content_urls?.desktop?.page || !data?.extract) return [];

    return [
      {
        title: data.title || subject,
        url: data.content_urls.desktop.page,
        source: "Wikipedia",
        snippet: data.extract,
        type: "reference",
      },
    ];
  } catch (error) {
    console.warn(`Wikipedia lookup failed: ${error.message}`);
    return [];
  }
};

const dedupeSources = (sources) => {
  const seen = new Set();
  return sources.filter((source) => {
    if (!source?.url) return false;
    const key = source.url.split("#")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const verifyClaim = async (claim) => {
  if (!claim?.trim()) {
    throw new Error("Claim is required");
  }

  const trimmedClaim = claim.trim();

  const [newsSources, factCheckSources, wikipediaSources] = await Promise.all([
    fetchNewsSources(trimmedClaim),
    fetchFactCheckSources(trimmedClaim),
    fetchWikipediaSource(trimmedClaim),
  ]);

  const sources = enrichAndRankSources(trimmedClaim, [
    ...factCheckSources,
    ...wikipediaSources,
    ...newsSources,
  ]);

  // Short-circuit: if no sources passed relevance filtering, skip the LLM call.
  // Returning Unverified here avoids the LLM hallucinating a Contradicted verdict
  // purely from its own training knowledge with zero supplied evidence.
  if (sources.length === 0) {
    return {
      claim: trimmedClaim,
      verdict: "Unverified",
      confidence: 0,
      reasoning:
        "No sufficiently relevant sources were found for this claim. " +
        "Manual fact-checking against authoritative sources is recommended.",
      sources: [],
      sourceCount: 0,
      trustedSourceCount: 0,
    };
  }

  const { verdict, confidence, reasoning } = await compareClaimWithSources(
    trimmedClaim,
    sources
  );

  const trustedSourceCount = sources.filter((s) => s.trusted).length;

  return {
    claim: trimmedClaim,
    verdict,
    confidence: confidence ?? 50,
    reasoning,
    sources,
    sourceCount: sources.length,
    trustedSourceCount,
  };
};