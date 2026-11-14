// Excerpt from src/bench/cascade.ts, comments translated to English. See 08-hybrid-cascade.md.

export type StopReason = 'risposta' | 'formato-non-valido' | 'errore-llm' | 'budget-tempo' | 'nessuna-evidenza' | 'interrotto' | string;
export interface AgentRun {
  answer: { text: string; insufficient: boolean; citations: unknown[] };
  stop: StopReason;            // 'risposta' = a well-formed final answer
  llm_calls: unknown[];        // per-call tokens (input, output, reasoning, cached) for the cost model
  total_ms: number;
  error?: string;
}

/**
 * Router cascade measured in F1: first the reader on locally retrieved evidence (few tokens),
 * then the tool-calling agent only if the reader has no usable answer. The signal is the reader's
 * OUTCOME (abstention, format failure, error), not a numeric self-assessment: with the local 9B,
 * errors were silent (it abstained on only 4 of its 34 wrong answers).
 */
export interface CascadeInfo {
  escalated: boolean;
  /** 'astensione' (abstention), or the reader's stop reason when it is not a normal answer; null if the reader suffices. */
  reason: string | null;
  first: { answer: AgentRun['answer']; stop: StopReason; llm_calls: unknown[]; total_ms: number; error?: string };
}

export function escalationReason(first: AgentRun): string | null {
  if (first.stop !== 'risposta') return first.stop;
  return first.answer.insufficient ? 'astensione' : null;
}

/**
 * `first`: reader run; `escalate`: agent. The final record carries the LLM calls and the time of BOTH
 * stages, so cost and latency are those of the cascade, not of its last stage.
 */
export async function runCascade(first: AgentRun, escalate: () => Promise<AgentRun>): Promise<{ run: AgentRun; cascade: CascadeInfo }> {
  const reason = escalationReason(first);
  const info: CascadeInfo = { escalated: reason !== null, reason,
    first: { answer: first.answer, stop: first.stop, llm_calls: first.llm_calls, total_ms: first.total_ms, ...(first.error ? { error: first.error } : {}) } };
  if (reason === null) return { run: first, cascade: info };
  const second = await escalate();
  return { run: { ...second, llm_calls: [...first.llm_calls, ...second.llm_calls], total_ms: first.total_ms + second.total_ms }, cascade: info };
}
