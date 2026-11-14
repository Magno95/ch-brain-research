# Code excerpts

[← README](../README.md)

These files are **excerpts** of the components that mattered most in the research, taken from the project's TypeScript code base (Node.js 24, strict mode). Comments and error messages have been translated into English. The reader prompts keep the original Italian and include an English translation. The excerpts are not a buildable package: types and helpers from the rest of the code base have been inlined or reduced to what each file needs.

| File | What it shows | Discussed in |
| --- | --- | --- |
| [rrf-fusion.ts](rrf-fusion.ts) | Reciprocal Rank Fusion over per-passage lists from five lexical channels and the semantic channel; de-duplication | [05](../05-retrieval-ablations.md) |
| [retrieval-presets.ts](retrieval-presets.ts) | The frozen retrieval variants B1–B6 and the name-independent configuration fingerprint | [05](../05-retrieval-ablations.md), [02](../02-methodology.md#26-reproducibility-and-run-identity) |
| [evidence-reader.ts](evidence-reader.ts) | Reader v2 prompt, the structured `answer` tool, evidence blocks, ID validation | [05](../05-retrieval-ablations.md), [06](../06-vm-validation.md#64-reader-v2) |
| [cascade.ts](cascade.ts) | Outcome-based escalation from reader to agent, with summed cost and latency | [08](../08-hybrid-cascade.md) |
| [vram-watchdog.ts](vram-watchdog.ts) | `nvidia-smi` sampler and VRAM margin watchdog for the shared vGPU; summary of the window checks | [01](../01-problem-and-constraints.md), [02](../02-methodology.md#27-the-gpu-window-protocol) |
| [egress-policy.ts](egress-policy.ts) | Data egress rules for local and cloud model endpoints | [01](../01-problem-and-constraints.md#14-operating-rules-we-could-not-break) |
| [stats.ts](stats.ts) | Wilson intervals and the exact McNemar test | [02](../02-methodology.md#24-statistics) |

## Retrieval pipeline order

For orientation, the evidence engine's pipeline (`retrieveEvidence`) runs these phases. Each phase records its time, counts, fallbacks and truncations in a trace that never contains source text:

1. **Authorisation**: token not revoked or expired, space and revision configured for the token.
2. **Lexical channels** per passage: literal, normalised, expanded, title, OR (20 hits each).
3. **Semantic channel**: query embedding (Qwen3-Embedding-0.6B, CPU) → top 20 from a side vector index cached by passage hash.
4. **Fusion**: RRF with k = 60, then de-duplication of identical text.
5. **Reranking**: top 30 candidates scored by Qwen3-Reranker-0.6B (P("yes") from first-token logprobs), 30 s timeout.
6. **Evidence selection**: one passage for each page named in the question first, then candidate order; ≤ 8 passages, ≤ 3,000 estimated tokens, ≤ 3 per page; each passage **re-read from the Git snapshot** (same page hash, same lines). A passage that cannot be verified is omitted, never reconstructed.
7. *(optional, off by default)* graph expansion by one hop, and linked source passages under `sources:read`.
