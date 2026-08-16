// Department Chief (§4b) for the daily digest — the named team, orchestrated in one
// place instead of inline in digest.ts:
//   Researcher = the verified KPI facts (passed in) → Maker (narrateDigest) →
//   Critic (narrativeIsClean) → Editor (reviseDigest, one pass) → Recommender.
// A business digest must NEVER report a made-up figure, so the Critic is the last
// word: an unclean narrative that survives the Editor is dropped and only the raw
// verified numbers ship.
import { narrateDigest } from './maker';
import { reviseDigest } from './editor';
import { narrativeIsClean } from './verify';
import { recommendAction } from './recommender';

export interface ComposedDigest {
  narrative: string; // '' if nothing survived verification
  recommendation: string; // '' if none / unverified
}

export async function composeNarrative(
  dashboardName: string,
  facts: string,
  slipFacts: string,
): Promise<ComposedDigest> {
  const allFacts = `${facts}\n${slipFacts}`;

  // Maker → Critic → Editor (revise once) → Critic again.
  let narrative = await narrateDigest(dashboardName, facts, slipFacts).catch(() => '');
  if (narrative && !narrativeIsClean(narrative, allFacts).ok) {
    const revised = await reviseDigest(narrative, allFacts).catch(() => '');
    narrative = revised && narrativeIsClean(revised, allFacts).ok ? revised : '';
  }

  // Recommender: one concrete, fact-grounded action.
  const rec = await recommendAction(facts, slipFacts).catch(() => '');
  const recommendation = rec && narrativeIsClean(rec, allFacts).ok ? rec : '';

  return { narrative, recommendation };
}
