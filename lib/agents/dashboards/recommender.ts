// Recommender archetype (collected from Relevance/BI playbook) — turns the digest
// from "here are the numbers" into "here is the ONE thing to do about them".
// Grounded strictly on the KPI facts (no invented numbers); returns a single
// concrete next action, or '' when nothing warrants one.
import { narrate } from '../../ollama';
import { withSkills } from '../../skills/registry';

export async function recommendAction(facts: string, slipFacts: string): Promise<string> {
  if (!facts.trim()) return '';
  const rec = await narrate([
    {
      role: 'system',
      content: withSkills(
        'אתה יועץ עסקי. בהתבסס אך ורק על הנתונים שקיבלת, כתוב המלצת-פעולה אחת קונקרטית וישימה (משפט אחד) — מה לעשות עכשיו. אל תמציא מספרים. אם אין פעולה מתבקשת, החזר מחרוזת ריקה.',
        ['business-strategy'],
      ),
    },
    { role: 'user', content: `נתונים:\n${facts}${slipFacts ? `\n\nמדרדרים:\n${slipFacts}` : ''}\n\nההמלצה:` },
  ]);
  return (rec || '').trim();
}
