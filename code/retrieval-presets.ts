// Excerpt from src/retrieval/config.ts, comments translated to English.
// Every benchmark variant is a frozen configuration with a fingerprint that ignores its name.

import { createHash } from 'node:crypto';

type LexicalChannel = 'legacy' | 'literal' | 'normalized' | 'expanded' | 'title' | 'or';

export interface RetrievalConfig {
  name: string;
  lexical: { channels: LexicalChannel[]; perChannel: number };
  fusion: { method: 'rank' | 'rrf'; k: number; weights: Record<string, number> };
  /** `fallback`: semantic only if the strict lexical channels find fewer than `fallbackMinStrict` passages. */
  semantic: { mode: 'off' | 'always' | 'fallback'; topK: number; fallbackMinStrict: number };
  rerank: { enabled: boolean; maxCandidates: number; maxTokens: number; timeoutMs: number };
  bundle: { maxPassages: number; maxTokens: number; maxPerPage: number };
  /** M5, optional: passages from linked text sources, requires `sources:read`, separate budget. */
  sources?: { mode: 'linked'; maxSources: number; maxPassages: number; maxTokens: number };
  /** M6, optional: one hop over links/backlinks from the top bundle pages, hubs excluded. */
  expansion?: { mode: 'always' | 'adaptive'; seeds: number; maxPages: number; maxPassages: number; maxTokens: number; hubDegree: number; coverage: number };
}

/** Passages cut along Markdown structure, 200–400 estimated tokens. */
export const CHUNKER = { version: 'chunker-v1', maxTokens: 400, minTokens: 200 } as const;
/** Declared estimate (conservative for Italian text); real prompt tokens come from the runtime's `usage`. */
export const CHARS_PER_TOKEN_ESTIMATE = 2.5;

const STRICT: LexicalChannel[] = ['literal', 'normalized', 'expanded', 'title'];
const base = {
  lexical: { channels: STRICT, perChannel: 20 },
  fusion: { method: 'rrf' as const, k: 60, weights: {} },
  semantic: { mode: 'off' as const, topK: 20, fallbackMinStrict: 3 },
  rerank: { enabled: false, maxCandidates: 30, maxTokens: 12_000, timeoutMs: 30_000 },
  bundle: { maxPassages: 8, maxTokens: 3000, maxPerPage: 3 },
};

export const PRESETS: Record<string, RetrievalConfig> = {
  // B1: historical retrieve() as the only channel, order unchanged.
  'evidenza-legacy': { ...base, name: 'evidenza-legacy', lexical: { channels: ['legacy'], perChannel: 20 }, fusion: { method: 'rank', k: 60, weights: {} } },
  // B2a: strict channels fused with RRF.
  rrf: { ...base, name: 'rrf' },
  // B2b: + permissive OR channel.
  'rrf-or': { ...base, name: 'rrf-or', lexical: { channels: [...STRICT, 'or'], perChannel: 20 } },
  // B3: + semantic channel, always on.
  'rrf-or-sem': { ...base, name: 'rrf-or-sem', lexical: { channels: [...STRICT, 'or'], perChannel: 20 }, semantic: { ...base.semantic, mode: 'always' } },
  // Ablation: reranker without semantic.
  'rrf-or-rerank': { ...base, name: 'rrf-or-rerank', lexical: { channels: [...STRICT, 'or'], perChannel: 20 }, rerank: { ...base.rerank, enabled: true } },
  // B4: the candidate configuration.
  'rrf-or-sem-rerank': { ...base, name: 'rrf-or-sem-rerank', lexical: { channels: [...STRICT, 'or'], perChannel: 20 },
    semantic: { ...base.semantic, mode: 'always' }, rerank: { ...base.rerank, enabled: true } },
};

const B4 = PRESETS['rrf-or-sem-rerank']!;
PRESETS['b4-fonti'] = { ...B4, name: 'b4-fonti', sources: { mode: 'linked', maxSources: 12, maxPassages: 2, maxTokens: 1000 } };                         // B5
PRESETS['b4-grafo-adattivo'] = { ...B4, name: 'b4-grafo-adattivo',                                                                                      // B6
  expansion: { mode: 'adaptive', seeds: 3, maxPages: 2, maxPassages: 2, maxTokens: 800, hubDegree: 15, coverage: 0.7 } };

/** Canonical JSON: sorted keys, so the same object gives the same string everywhere. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Fingerprint of configuration + chunker; the name does not count: two names for the same values coincide. */
export function configFingerprint(config: RetrievalConfig): string {
  const { name: _name, ...values } = config;
  return createHash('sha256').update(canonicalJson({ ...values, chunker: CHUNKER, chars_per_token: CHARS_PER_TOKEN_ESTIMATE })).digest('hex').slice(0, 16);
}
