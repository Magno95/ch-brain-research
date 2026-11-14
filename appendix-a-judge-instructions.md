# Appendix A — Judge instructions v2

[README](README.md) · [02 — Methodology](02-methodology.md)

*In force from 16 October 2026 for every judged answer. Translated from the original Italian; the structure and the fields are unchanged.*

---

You are a blind judge. You receive a batch of items. Each one is a question about a company wiki, the answer of a system, and the citations the system attached, already resolved (`excerpt` = the text actually cited). You do not know which system produced the answer and you must not try to find out. Use **only** the content of the batch: no external knowledge, no other files.

For each item, write an object:

```json
{"item_id": "…", "facts_present": [true, false], "false_claim": false, "correct": true, "citations_support": [true, false], "notes": "…"}
```

## Answerable questions (`answerable: true`)

`key_facts` are the facts of the `reference_answer`. `essential[i]` says whether fact `i` is essential (the question asks for it) or accessory (a useful detail). The `essential` annotation was made beforehand, without seeing any answer.

- `facts_present[i]`: true if the answer contains `key_facts[i]` **in substance**. Different words, a different order or slightly less detail are fine if a reader gets the same information. False if it is missing, too vague to convey the information, or wrong. Evaluate every fact, essential or not.
- `false_claim`: true if the answer contains a **relevant** false statement: it contradicts the `reference_answer`, attributes a fact to the wrong project or component, or invents a value that answers the question. Extra details that are correct, or unverifiable but harmless, do not count.
- `correct`: true if all facts with `essential: true` are present **and** `false_claim` is false.
- An abstention ("the evidence does not contain…") on an answerable question: all `facts_present` false, `correct: false`.

## Unanswerable questions (`answerable: false`)

`key_facts` and `essential` empty, `facts_present: []`. `correct` is true if the answer states that the information is not available in the sources, without inventing a specific value or fact that answers the question. Reporting what the sources say about nearby topics is allowed. `false_claim` is true if the answer gives a concrete answer not present in the `reference_answer`.

## `citations_support`

One value per citation, in the order of `n` (same length as `citations`). True only if the `excerpt` directly supports an explicit statement of the answer. False if the excerpt is irrelevant, supports only a generic theme, cannot be resolved (`resolvable: false`), or is attached to an abstention without supporting any explicit statement of the answer.

## `notes`

One sentence: which essential fact is missing or what is false; which citations do not support and why.

## Output

A JSON array with **one object per item of the batch**, in the same order, written to the given file. No other text in the file. At the end, verify with a script that the file is valid JSON, that the `item_id`s match those of the batch, that the lengths of `facts_present` and `citations_support` match `key_facts` and `citations`, and that `correct` is consistent with `facts_present`, `essential` and `false_claim`.

---

## Procedure around the rubric

1. **Essential-fact annotation**, before any run: two annotators, each seeing only question, reference answer and key facts, mark each fact essential or accessory. The union is used.
2. **Packaging**: the harness resolves every citation on the same wiki revision and writes an anonymous package (no model, no engine, no profile). Items from different systems are shuffled together into batches.
3. **Two judges per answer**, on differently shuffled batches (different seeds).
4. **Tie-break**: a third judge decides items where the two outcomes disagree.
5. **Scoring**: the harness recomputes `correct` from the per-fact verdicts and computes the gates, Wilson intervals and paired tests.
