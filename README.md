# HELIX DASHBOARDS

פלטפורמת דשבורדים אוניברסלית לעסק — עברית-first. Next.js 15 + TypeScript + Tailwind + Supabase (RTL), עם recharts + react-grid-layout.

3 דרכים לדשבורד (Templates / Drag-drop / AI-Recommend), 10 חבילות per-סוג-עסק (verticals), connectors חיים, עדכון אוטומטי דרך Ollama/Claude, ומסירה רב-ערוצית (טלגרם/וואטסאפ/מייל).

## הרצה מהירה
```bash
npm install
cp .env.example .env.local   # מלא לפחות את משתני ה-Supabase
npm run dev                  # http://localhost:3000
```

## הקמה (Setup)
1. **Supabase** — פתח פרויקט והרץ את [`supabase/schema.sql`](supabase/schema.sql) ב-SQL Editor (כל הטבלאות + RPC `create_workspace` + RLS).
2. **env** — העתק `.env.example` → `.env.local` ומלא. משתני Supabase חובה; השאר לפי הצורך.
3. **Auth** — ב-Supabase → Auth → URL Configuration הוסף `NEXT_PUBLIC_SITE_URL/auth/callback` כ-redirect.
4. **Deploy** — Vercel (ה-crons ב-[`vercel.json`](vercel.json) מופעלים אוטומטית; הגדר `CRON_SECRET`).

## ארכיטקטורה
```
[SaaS API] → [connector] → normalize → [metric_points (Supabase)] → [widget (recharts)]
```
- **widgets** — ספרייה אטומית (`components/widgets/`), נקראים מ-`metric_points` בלבד.
- **דשבורדים** — `dashboards` + `dashboard_widgets` (layout נשמר). Templates ב-`lib/templates.ts`.
- **connectors** — `lib/connectors/*` → `registry.ts` → `metric_points`. חיים: GA4 · Meta · Stripe · Shopify · Plausible · Mailchimp.
- **סוכן** — `lib/ollama.ts` (Ollama→Claude) → `lib/digest.ts` נרטיב עברי → `lib/channels.ts` מסירה.

## מסלולים עיקריים
| נתיב | תיאור |
|---|---|
| `/` | בית — בחירת vertical + gallery + AI-recommend |
| `/dashboard/[key]` | דשבורד מחלקתי — drag-drop, נתונים אמיתיים/demo, "סיכום AI" |
| `/connect` | חיבור מקורות נתונים (6 connectors) |
| `/deals` | צנרת מכירות native (Kanban) → מזין מדדי מכירות |
| `/digest` | הרשמה לסיכום יומי + חיבור בוט טלגרם |
| `/api/cron/{sync,digest}` | רענון connectors יומי + שליחת סיכומים שעתית |
| `/api/telegram` | webhook בוט |

## מה נשאר להשלים (למפתח הממשיך)
- connectors נוספים: **הנהח״ש ישראלי** (GreenInvoice/חשבשבת — edge-fn), CRM (Nango/SDK), Support, Product.
- בוט **WhatsApp נכנס** (`/api/whatsapp` בדגם `/api/telegram`).
- **funnel/table** מ-real-data (כרגע demo) — הרחבת `lib/metrics-db.ts`.
- **Executive aggregation** — שכבת-על חוצה-מחלקות (ה-moat).
- אבטחת prod: מעבר מ-`connections.config` מוצפן ל-Supabase Vault.

רישיון: פרטי (HELIX). כולל קוד שנקצר תחת MIT — ראה הערות-קרדיט בקבצי ה-connectors.
