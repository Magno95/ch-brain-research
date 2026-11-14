# Appendix B — Glossary

[README](README.md)

| Term | Meaning in this log |
| --- | --- |
| **Agent** (B0) | An LLM in a tool-calling loop over the 13 read-only MCP tools, ending with a structured `answer` call. Profiles: navigation, lexical, hybrid. |
| **all@k** | Number of questions with *all* expected pages among the pages of the top *k* results. Strict by design. |
| **B0–B6** | Variant identifiers: B0 agent; B1–B4 evidence engine with progressively richer retrieval; B5 with linked sources; B6 with graph expansion. `g` = reranker in GPU, `v2` = reader v2. |
| **Bundle** | The ≤ 8 passages (≤ 3,000 estimated tokens, ≤ 3 per page) handed to the reader, each with an ID E1…En. |
| **Cascade** (M) | Local retrieval → cloud reader → cloud agent only if the reader abstains, fails the format or errors. |
| **Citation** | A locator to a versioned page or source, e.g. `page#lines=12-18`, resolved by the harness before judging. |
| **Commit charge** | Windows' committed virtual memory; when it runs out, allocations fail machine-wide. |
| **Compilation** | Turning raw sources into linked wiki pages with line-level citations, followed by validation and review. |
| **Essential fact** | A key fact the question actually asks for, annotated blind before the runs. |
| **Evidence engine** | Deterministic retrieval + one LLM call that reads the bundle and maps each claim to evidence IDs. |
| **F0 / F1** | Project phases: F0 read-only wiki with lexical retrieval; F1 model and retrieval benchmark. Also the names of the first two question sets. |
| **Holdout 1 / 2** | Question sets written by isolated agents after the system under test was fixed; holdout 2 decided the architecture. |
| **MCP** | Model Context Protocol; the server exposes domain tools (search, read section, links, graph, source read) instead of a filesystem. |
| **McNemar (exact)** | Paired test on discordant answers (right in A only vs right in B only), two-sided binomial with p = ½. |
| **MRR** | Mean reciprocal rank of the first expected page. |
| **Oracle** (O0) | The reader given the correct passages; measures reading with perfect retrieval. O1 adds four distractors. |
| **Reader v1 / v2** | Prompt and answer-tool versions of the evidence reader; v2 forbids citations on abstentions, caps evidence per claim at 3 and adds rules for conflicts and changes over time. |
| **RRF** | Reciprocal Rank Fusion: score(d) = Σ_c w_c / (k + rank_c(d)), k = 60, with rank starting at 1. |
| **Snapshot** | A commit read directly from Git objects, without checkout. |
| **Source detail** | A question whose answer exists only in an original source, not in the compiled wiki. |
| **vGPU L40S-8Q** | An 8 GiB time-sliced profile of an NVIDIA L40S, shared with desktop sessions. |
| **Window** | An agreed time slot in which a model may be loaded on the shared vGPU; always ends with the model unloaded. |
