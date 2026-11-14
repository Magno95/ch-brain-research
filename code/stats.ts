// Statistics used in every report. `wilson` is from src/bench/evaluate.ts; `mcnemarExact` is a reference
// implementation of the exact two-sided McNemar test used for the paired comparisons.

/** Wilson 95% interval: with 44 questions a difference of a few points is inside the uncertainty. */
export function wilson(successes: number, n: number): [number, number] | null {
  if (!n) return null;
  const z = 1.96, p = successes / n, d = 1 + z * z / n;
  const centre = (p + z * z / (2 * n)) / d;
  const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/**
 * Exact McNemar on paired outcomes: b = correct only for A, c = correct only for B.
 * Under H0 the discordant pairs are Binomial(b + c, 1/2); two-sided p = min(1, 2 * P(X <= min(b, c))).
 */
export function mcnemarExact(b: number, c: number): number {
  const n = b + c;
  if (n === 0) return 1;
  const k = Math.min(b, c);
  let tail = 0, coef = 1;                       // coef = C(n, i)
  for (let i = 0; i <= k; i++) {
    if (i > 0) coef = coef * (n - i + 1) / i;
    tail += coef;
  }
  return Math.min(1, 2 * tail / 2 ** n);
}

/** Pairs two runs by question id and returns the discordant counts. */
export function discordant(a: Map<string, boolean>, b: Map<string, boolean>): { onlyA: number; onlyB: number } {
  let onlyA = 0, onlyB = 0;
  for (const [id, okA] of a) {
    const okB = b.get(id);
    if (okB === undefined) continue;
    if (okA && !okB) onlyA++;
    if (!okA && okB) onlyB++;
  }
  return { onlyA, onlyB };
}

// Examples from the reports:
//   mcnemarExact(2, 10)  -> 0.039   (evidence v2, 4B -> 9B, 88 questions)
//   mcnemarExact(0, 12)  -> 0.0005  (holdout 2, local vs cascade)
//   mcnemarExact(7, 13)  -> 0.26    (known sets, cascade vs cloud agent)
