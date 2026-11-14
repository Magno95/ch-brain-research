# Data

[← README](../README.md)

Result tables behind the charts and tables of this log, as CSV. They are aggregates: per-question records, answers, judge packages and verdicts contain internal documentation and are not published.

| File | Content | Source document |
| --- | --- | --- |
| [01-lexical-baseline-2026-10-13.csv](01-lexical-baseline-2026-10-13.csv) | Lexical retrieval hits by category, known vs independent set | [03](../03-lexical-baseline.md) |
| [02-model-comparison-2026-10-13.csv](02-model-comparison-2026-10-13.csv) | Four local models × three agent profiles × two sets, with VRAM | [04](../04-local-model-selection.md) |
| [03-retrieval-only-2026-10-15.csv](03-retrieval-only-2026-10-15.csv) | Retrieval metrics of every variant, no generation | [05](../05-retrieval-ablations.md) |
| [04-generation-laptop-2026-10-15.csv](04-generation-laptop-2026-10-15.csv) | Generation with the 4B, provisional judging (v1) | [05](../05-retrieval-ablations.md) |
| [05-vm-dual-judge-2026-10-16.csv](05-vm-dual-judge-2026-10-16.csv) | 4B and 9B, agent vs evidence engine, F1 and holdout 1, protocol v2 | [06](../06-vm-validation.md) |
| [06-vm-placement-2026-10-16.csv](06-vm-placement-2026-10-16.csv) | Reranker CPU vs GPU on the VM: latency, VRAM, commit | [06](../06-vm-validation.md) |
| [07-frontier-2026-10-19.csv](07-frontier-2026-10-19.csv) | Gemini Flash and Pro as agent and as reader, tokens | [07](../07-frontier-ceiling.md) |
| [08-cascade-2026-10-22.csv](08-cascade-2026-10-22.csv) | Local, cascade, cloud on three sets, with cost | [08](../08-hybrid-cascade.md) |
| [09-cascade-cost-breakdown-2026-10-22.csv](09-cascade-cost-breakdown-2026-10-22.csv) | Where the cascade's cost goes | [08](../08-hybrid-cascade.md) |

Conventions: empty cells mean "not reported". Percentages are of answerable questions, except abstention columns, which count unanswerable questions. Costs use the introductory list price of October 2026 ($0.75/M input, $3.75/M output and thinking tokens); prices double from 1 January 2027. In `08-cascade`, the `f1+holdout1` citation and p50 values are means of the two per-set values.
