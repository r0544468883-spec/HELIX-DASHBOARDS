// Maker archetype — writes the human daily-digest narrative from the verified KPI
// facts. Numbers come ONLY from the facts it's handed (the Researcher's output); the
// Critic (verify) enforces that afterwards. narrate() is the shared Ollama/Claude client.
import { narrate } from '../../ollama';

export async function narrateDigest(dashboardName: string, facts: string, slipFacts: string): Promise<string> {
  return narrate([
    {
      role: 'system',
      content:
        'אתה אנליסט עסקי שכותב בעברית טבעית, קצרה ואנושית. אל תמציא מספרים — השתמש רק בנתונים שקיבלת. 2-3 משפטים, טון ישראלי ענייני. הדגש חריגות והמלצה אחת.',
    },
    {
      role: 'user',
      content: `דשבורד "${dashboardName}". הנתונים:\n${facts}${slipFacts ? `\n\nמדדים שמידרדרים:\n${slipFacts}` : ''}\n\nכתוב סיכום יומי קצר.`,
    },
  ]);
}
