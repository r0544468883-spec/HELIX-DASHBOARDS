// Deterministic narrative fact-guard (charter §4b, Critic archetype) for the daily
// digest. The narrator model is TOLD "don't invent numbers" — but nothing enforced
// it. This checks that every number the narrative states actually appears in the
// underlying KPI facts; if a fabricated figure slips in, the caller drops the
// narrative and ships the raw, verified facts instead. Pure logic, no model call —
// a cheap adversarial check on the one thing a business digest must never do:
// report a number that isn't real.

function numbersIn(s: string): string[] {
  const raw = s.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return raw.map((x) => x.replace(/,/g, ''));
}

/**
 * A narrative number is "stray" only if it shares no leading digits with any fact
 * number and is not a substring of the facts — so legitimate rounding of a real
 * figure (12.5% → "12%") is allowed, while an invented figure ("847 לחיצות" with
 * no 8xx in the data) is caught.
 */
export function narrativeIsClean(narrative: string, facts: string): { ok: boolean; strayNumbers: string[] } {
  const factNums = numbersIn(facts);
  const stray: string[] = [];
  for (const n of numbersIn(narrative)) {
    if (n.length < 2) continue; // ignore single digits (counts, list markers)
    const known =
      facts.includes(n) ||
      factNums.some((f) => f.startsWith(n) || n.startsWith(f));
    if (!known) stray.push(n);
  }
  return { ok: stray.length === 0, strayNumbers: [...new Set(stray)] };
}
