// Excerpt from src/retrieval/fusion.ts, comments translated to English.
// Reciprocal Rank Fusion over per-passage ranked lists (lexical channels + semantic).
// See 05-retrieval-ablations.md.

export interface Chunk { id: string; sha256: string; ref: string; start_line: number; end_line: number }
export type Channel = 'legacy' | 'literal' | 'normalized' | 'expanded' | 'title' | 'or' | 'semantic';
export interface RankedList { channel: Channel; hits: Array<{ chunk: Chunk; score: number; query?: string }> }
export interface Candidate {
  chunk: Chunk;
  channels: Array<{ channel: Channel; rank: number; score: number; query?: string }>;
  fused: number;
  duplicates?: Array<{ chunk_id: string; ref: string; start_line: number; end_line: number }>;
}
export interface FusionConfig { method: 'rank' | 'rrf'; k: number; weights: Partial<Record<Channel, number>> }

const order = (a: Chunk, b: Chunk) => a.ref.localeCompare(b.ref) || a.start_line - b.start_line;

/**
 * Reciprocal Rank Fusion: each channel contributes `weight / (k + rank)`, rank starting at 1,
 * zero for channels that do not contain the passage. Identity is the passage, not the page.
 * Ties: best single rank, then more channels, then document order.
 * `rank`: a single list, order unchanged (control variant B1).
 */
export function fuse(lists: RankedList[], fusion: FusionConfig): Candidate[] {
  const byId = new Map<string, Candidate & { best: number }>();
  for (const list of lists) {
    const weight = fusion.weights[list.channel] ?? 1;
    const seen = new Set<string>();
    for (const hit of list.hits) {
      // The same passage twice in one list counts once, at its best rank.
      if (seen.has(hit.chunk.id)) continue;
      seen.add(hit.chunk.id);
      const rank = seen.size;
      const entry = byId.get(hit.chunk.id) ?? { chunk: hit.chunk, channels: [], fused: 0, best: Infinity };
      entry.channels.push({ channel: list.channel, rank, score: hit.score, ...(hit.query ? { query: hit.query } : {}) });
      entry.fused += fusion.method === 'rank' ? 1 / rank : weight / (fusion.k + rank);
      entry.best = Math.min(entry.best, rank);
      byId.set(hit.chunk.id, entry);
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.fused - a.fused || a.best - b.best || b.channels.length - a.channels.length || order(a.chunk, b.chunk))
    .map(({ best: _best, ...candidate }) => candidate);
}

/** Drops passages with identical text (repeated boilerplate), keeping their provenance on the first one. */
export function dedupe(candidates: Candidate[]): Candidate[] {
  const kept = new Map<string, Candidate>();
  for (const c of candidates) {
    const first = kept.get(c.chunk.sha256);
    if (!first) { kept.set(c.chunk.sha256, { ...c }); continue; }
    first.duplicates = [...first.duplicates ?? [], { chunk_id: c.chunk.id, ref: c.chunk.ref, start_line: c.chunk.start_line, end_line: c.chunk.end_line }];
  }
  return [...kept.values()];
}

/*
 * Note on the lexical channels feeding fuse() (src/retrieval/lexical.ts):
 * - literal:    all words of the question, AND
 * - normalized: significant terms only, AND
 * - expanded:   variants from a versioned lexicon, merged into ONE list (best rank per passage),
 *               so that sixteen near-identical rewrites do not count as sixteen independent votes
 * - title:      pages whose title or alias equals a 1–4 term sequence of the question
 * - or:         significant terms and variant terms, OR; the permissive channel that produced the
 *               largest single gain (12 -> 31 questions fully covered)
 */
