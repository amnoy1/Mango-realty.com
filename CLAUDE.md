# Mango Realty — Project Context

## הפרויקט
אתר נדל"ן high-end עבור אמיר (מתווך, Mango Realty). מתחרה על Compass/KEYZ.
Hebrew-first, RTL, Next.js 15 App Router, Tailwind v4, Supabase, Vercel.

## קישורים
- **GitHub**: https://github.com/amnoy1/Mango-realty.com
- **Live**: https://mango-realty-com.vercel.app
- **Supabase**: https://sgrphwunigmsdtbmilgd.supabase.co (Frankfurt)
- **Working dir**: `c:\אמיר\AMIR AI\Mango-realty.com`

## Stack
| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 15 App Router + TypeScript |
| Styling | Tailwind v4 + Framer Motion |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Google OAuth |
| Storage | Supabase Storage (`property-images` bucket) |
| AI | Claude claude-sonnet-4-6 via Anthropic SDK |
| Hosting | Vercel (Fluid Compute, auto-deploy from main) |

## Brand Colors
```
--color-mango:        #F5A623
--color-gold:         #D4A853
--color-luxury-black: #1C1C1E
--color-cream:        #FFF8F0  ← רקע האתר
--color-charcoal:     #2D2D2D
```
Fonts: Heebo (headings) / Assistant (body) / Playfair Display (serif accents)

## מה בנוי (סטטוס 2026-06-22)

### Public Site
- Homepage: Navbar, Hero, Stats, FeaturedProperties, AIAgentSection, Neighborhoods, HowItWorks, Footer
- `/properties/[slug]` — דף נכס: gallery slider, Google Maps embed, Street View popup, agent card, related properties
- `/properties` — דף רשימת נכסים (קיים, ריק עד שיעלו נכסים)
- `FeaturedProperties` — server component, מושך נכסים אמיתיים מ-Supabase (ללא mock data)
- **סקשין שכונה — הוסר** (נבנה ואחר-כך הוסר מדף הנכס. הקוד קיים ב-`lib/neighborhood.ts` ו-`components/properties/NeighborhoodSection.tsx` אם יחזור בעתיד)

### Admin Panel (`/admin`) — ✅ מוכן לשימוש
- Google OAuth — רק `amir@mango-realty.com` נכנס
- Middleware (`middleware.ts`) — מגן על `/admin/*`, מפנה ל-login אם לא מחובר
- `AdminLayout` — מציג chrome רק למשתמש מאומת, אחרת מעביר children (middleware עושה redirect)
- `/admin/login` — Google Sign-In page
- `/admin/properties` — רשימת נכסים + עריכה + מחיקה
- `/admin/properties/new` — יצירת נכס חדש
- `/admin/properties/[id]/edit` — עריכת נכס
- `components/admin/PropertyForm.tsx` — טופס מלא
- `components/admin/ImageUploader.tsx` — drag & drop, עד 20 תמונות

### API Routes
- `POST /api/admin/properties` — יצירת נכס
- `PATCH/DELETE /api/admin/properties/[id]` — עדכון/מחיקה
- `POST /api/admin/upload-images` — העלאה ל-Supabase Storage

### SiteManager (`scripts/site-manager/`)
- סוכן Node.js: סורק תיקיות → Claude מחלץ → WhatsApp לאישור → Supabase
- Watch folder: `C:\תיקייה ציבורית\תיקייה ציבורית חדשה`
- Selected photos folder: מחפש `נבחרו` / `תמונות נבחרות` / `נבחרות` / `selected`
- `.env` נדרש: `WATCH_FOLDER`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- הרצה: `node index.js` | בדיקה ללא WhatsApp: `SKIP_WHATSAPP=true` ב-.env
- **npm install בוצע** — חבילות מותקנות

## DB Schema (עיקרי)
```sql
properties: id, slug, title, price, price_type, property_type, status,
            rooms, bathrooms, area_sqm, floor, total_floors,
            city, neighborhood, street, lat, lng,
            features (JSONB), images (text[]),
            meta_title, meta_description, embedding (vector(1536)),
            published_at, created_at, updated_at
```
RLS: public read על `status = 'active'`, service_role לכל השאר.

## ✅ פעולות ידניות שבוצעו
1. ✅ Google OAuth ב-Supabase → Providers → Google → Client ID + Secret
2. ✅ Authorized redirect URI: `https://sgrphwunigmsdtbmilgd.supabase.co/auth/v1/callback`
3. ✅ Supabase URL Config → Site URL: `https://mango-realty-com.vercel.app`
4. ✅ Redirect URLs הוספו: `/auth/callback` + `/auth/handle`
5. ✅ `handle_new_user` trigger — הורץ עם EXCEPTION handler (לא יבלוק login)
6. ✅ `user_profiles` טבלה נוצרה + RLS policy
7. ✅ ERR_TOO_MANY_REDIRECTS נפתר

## ✅ Google OAuth — עובד! (נפתר 2026-06-22)
**הפתרון:** `auth: { flowType: "implicit" }` בשני הדפים (login + handle)
- Login: `app/admin/login/page.tsx` — `flowType: "implicit"` + `redirectTo: /auth/handle`
- Handle: `app/auth/handle/page.tsx` — `getSession()` מזהה hash אוטומטית, שומר session ב-cookies

## ⏭️ הצעד הבא — להמשיך מכאן
1. **הרץ סוכן:** `cd scripts/site-manager && node index.js` (Storage bucket + .env אמורים להיות מוכנים)
2. **Phase 2** — AI Search, פילטרים ב-`/properties`, WhatsApp Agent

## Phase הבא (Phase 2)
1. AI Search — חיפוש בשפה טבעית + pgvector
2. `/properties` — פילטרים (עיר, מחיר, חדרים)
3. Google Auth לקונים
4. WhatsApp Agent — Claude + Twilio
5. SEO — JSON-LD schema, sitemap
