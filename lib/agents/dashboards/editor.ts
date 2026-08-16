// Editor archetype — the revise pass when the Critic (verify) flags the narrative for
// a number not backed by the facts. Re-narrates using ONLY the supplied facts. The
// caller re-checks; if it's still unclean the narrative is dropped (raw numbers ship).
import { narrate } from '../../ollama';

export async function reviseDigest(narrative: string, allFacts: string): Promise<string> {
  return narrate([
    {
      role: 'system',
      content:
        'אתה עורך. שכתב את הסיכום כך שישתמש אך ורק במספרים שמופיעים בעובדות שסופקו. אל תמציא אף מספר. 2-3 משפטים, עברית טבעית.',
    },
    { role: 'user', content: `עובדות (המקור היחיד למספרים):\n${allFacts}\n\nסיכום לתקן:\n${narrative}` },
  ]);
}
