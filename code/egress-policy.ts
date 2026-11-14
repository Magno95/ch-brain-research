// Excerpt from src/llm/policy.ts, messages and comments translated to English. See 01 §1.4.

export type Classification = 'internal' | 'restricted' | 'prohibited_for_llm';
interface PolicyConfig { frontierEnabled: boolean; llmAllowedEndpoints: string[] }

/**
 * Data egress towards an LLM endpoint. The default profile is local: a loopback endpoint on the same
 * machine may receive `internal` and `restricted`; no `prohibited_for_llm` text goes to any model.
 * A non-local endpoint requires FRONTIER_ENABLED and an origin listed in LLM_ALLOWED_ENDPOINTS,
 * and receives only `internal`. The flag alone is not enough. Embedding and reranking endpoints are
 * checked with the same function, because they also receive wiki text.
 */
export function assertLlmDestination(baseUrl: string, classification: Classification, config: PolicyConfig): void {
  if (classification === 'prohibited_for_llm') throw new Error('policy: prohibited_for_llm content, never sent to models');
  let url: URL;
  try { url = new URL(baseUrl); } catch { throw new Error('policy: invalid LLM endpoint'); }
  if (url.username || url.password) throw new Error('policy: credentials in the endpoint URL');
  if (isLoopback(url.hostname)) return;
  if (!config.frontierEnabled) throw new Error(`policy: non-local endpoint ${url.origin} with FRONTIER_ENABLED=false`);
  if (!config.llmAllowedEndpoints.includes(url.origin)) throw new Error(`policy: endpoint ${url.origin} not allowed`);
  if (url.protocol !== 'https:') throw new Error('policy: non-local endpoint without TLS');
  if (classification !== 'internal') throw new Error(`policy: ${classification} content only to local endpoints`);
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
}

/** The most restrictive classification among the space's sources: a page may quote their text. */
export function spaceClassification(classes: Iterable<string>): Classification {
  const values = new Set(classes);
  if (values.has('prohibited_for_llm')) return 'prohibited_for_llm';
  if (values.has('restricted')) return 'restricted';
  for (const v of values) if (v !== 'internal') throw new Error(`unknown classification: ${v}`);
  return 'internal';
}
