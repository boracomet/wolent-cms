/**
 * Tahmini Gemini API maliyeti (USD), Google AI “Standard / paid tier” metin fiyatlarına göre.
 * https://ai.google.dev/gemini-api/docs/pricing — fiyatlar değişebilir; yalnızca kabaca tahmindir.
 */

export type GeminiUsdEstimate = {
  usd: number
  usdPerMillionInput: number
  usdPerMillionOutput: number
  usedLongContextTier: boolean
  matchedRule: string
}

type RateRule = {
  id: string
  test: (id: string) => boolean
  inputPerM: number
  outputPerM: number
  /** İstemci ~200k üzeri girdide Pro ailesi için yüksek tarife */
  inputPerMLong?: number
  outputPerMLong?: number
}

const LONG_PROMPT_TOKENS = 200_000

// Sıra: daha spesifik kurallar önce (flash-lite, flash’tan önce)
const RULES: RateRule[] = [
  {
    id: "gemini-3.1-flash-lite",
    test: (id) => /gemini-3\.1-flash-lite/.test(id),
    inputPerM: 0.25,
    outputPerM: 1.5,
  },
  {
    id: "gemini-3.1-pro",
    test: (id) => /gemini-3\.1-pro/.test(id),
    inputPerM: 2,
    outputPerM: 12,
    inputPerMLong: 4,
    outputPerMLong: 18,
  },
  {
    id: "gemini-2.5-pro",
    test: (id) => /gemini-2\.5-pro/.test(id),
    inputPerM: 1.25,
    outputPerM: 10,
    inputPerMLong: 2.5,
    outputPerMLong: 15,
  },
  {
    id: "gemini-2.5-flash-lite",
    test: (id) => /gemini-2\.5-flash-lite/.test(id),
    inputPerM: 0.1,
    outputPerM: 0.4,
  },
  {
    id: "gemini-2.5-flash",
    test: (id) => /gemini-2\.5-flash/.test(id),
    inputPerM: 0.3,
    outputPerM: 2.5,
  },
  {
    id: "gemini-2.0-flash-lite",
    test: (id) => /gemini-2\.0-flash-lite/.test(id),
    inputPerM: 0.075,
    outputPerM: 0.3,
  },
  {
    id: "gemini-2.0-flash",
    test: (id) => /gemini-2\.0-flash/.test(id),
    inputPerM: 0.1,
    outputPerM: 0.4,
  },
  {
    id: "gemini-1.5-flash-8b",
    test: (id) => /gemini-1\.5-flash-8b/.test(id),
    inputPerM: 0.0375,
    outputPerM: 0.15,
  },
  {
    id: "gemini-1.5-flash",
    test: (id) => /gemini-1\.5-flash/.test(id),
    inputPerM: 0.075,
    outputPerM: 0.3,
  },
  {
    id: "gemini-1.5-pro",
    test: (id) => /gemini-1\.5-pro/.test(id),
    inputPerM: 1.25,
    outputPerM: 5.0,
    inputPerMLong: 2.5,
    outputPerMLong: 10.0,
  },
]

const DEFAULT_RULE: Omit<RateRule, "test"> = {
  id: "default-2.5-flash",
  inputPerM: 0.3,
  outputPerM: 2.5,
}

function pickRule(modelId: string): RateRule {
  const id = modelId.trim().toLowerCase()
  for (const r of RULES) {
    if (r.test(id)) return r
  }
  return { ...DEFAULT_RULE, test: () => true }
}

export function estimateGeminiUsdForTokens(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): GeminiUsdEstimate {
  const rule = pickRule(modelId)
  const long =
    inputTokens > LONG_PROMPT_TOKENS &&
    rule.inputPerMLong != null &&
    rule.outputPerMLong != null
  const inRate = long ? rule.inputPerMLong! : rule.inputPerM
  const outRate = long ? rule.outputPerMLong! : rule.outputPerM
  const usd = (inputTokens / 1_000_000) * inRate + (outputTokens / 1_000_000) * outRate
  return {
    usd,
    usdPerMillionInput: inRate,
    usdPerMillionOutput: outRate,
    usedLongContextTier: long,
    matchedRule: rule.id,
  }
}

export function formatUsdEstimate(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "~$0.00"
  if (usd < 0.000_05) return "<$0.0001"
  if (usd < 0.01) return `~$${usd.toFixed(4)}`
  if (usd < 1) return `~$${usd.toFixed(3)}`
  return `~$${usd.toFixed(2)}`
}
