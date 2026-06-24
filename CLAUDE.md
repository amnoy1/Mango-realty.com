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

## מה בנוי (סטטוס 2026-06-24)

### Public Site
- Homepage: Navbar, Hero, Stats, FeaturedProperties, AIAgentSection, Neighborhoods, HowItWorks, Footer
- `/properties/[slug]` — דף נכס מלא:
  - Gallery slider + thumbnails
  - Google Maps embed + Street View popup
  - Stats bar (חדרים, אמבטיות, מ"ר, קומה)
  - תיאור הנכס
  - **יתרונות הנכס** — chips עם אייקונים: מעלית, ממ"ד, מיזוג, חניה xN, מרפסת Nמ"ר, מחסן, גינה, מצב
  - **סקשין שכונה** — accordion (לחץ + לפתוח): תחבורה, חינוך, פנאי, מסחר, קהילה — AI Sonnet + web search, cache 6 חודשים בסופרבייס
  - Agent card + CTA
  - Related properties
- `/properties` — דף רשימת נכסים (קיים)
- `FeaturedProperties` — server component, נכסים אמיתיים מ-Supabase

### Admin Panel (`/admin`) — ✅ מוכן לשימוש
- Google OAuth — רק `amir@mango-realty.com` נכנס
- `/admin/properties` — רשימת נכסים + עריכה + מחיקה
- `/admin/properties/new` + `[id]/edit` — טופס מלא
- `components/admin/PropertyForm.tsx`:
  - **15 סוגי נכס**: דירה, דירת גג, דירת גן, פנטהאוז, מיני פנטהאוז, דופלקס, קוטג', קוטג' טורי, דו-משפחתי, בית פרטי/וילה, יחידת דיור, סטודיו/לופט, בניין, מגרש, מסחרי, אחר
  - **פרטים טכניים**: חדרים, אמבטיות, שטח, קומה, סה"כ קומות, שנת בנייה, מצב הנכס (5 אפשרויות), מרפסת/מחסן/גינה (מ"ר), חניה (ללא/1/2/3)
  - **מאפיינים**: מעלית, משופץ, מיזוג, ממ"ד
  - **SEO** — כפתור "✨ מלא אוטומטית" מייצר meta_title + meta_description מנתוני הטופס
- `components/admin/ImageUploader.tsx` — drag & drop, עד 20 תמונות

### DB — שינויים ידניים שבוצעו
- `DROP CONSTRAINT properties_property_type_check` — מאפשר כל סוג נכס חופשי
- טבלת `neighborhoods` נוצרה לcaching שכונות AI

### SEO / GEO — ✅ מוכן
- `generateMetadata` לכל נכס: og:image (תמונה אמיתית), twitter card, canonical URL
- **GEO meta tags**: `geo.region=IL`, `geo.placename`, `geo.position`, `ICBM` (lat/lng)
- **JSON-LD** `RealEstateListing`: מחיר, כתובת, geocoordinates, חדרים, שטח, תמונות
- **Sitemap**: `app/sitemap.ts` — auto-generates מכל נכסים פעילים
- `NEXT_PUBLIC_SITE_URL` env var — מעבר לדומיין = שינוי env אחד בלבד

### API Routes
- `POST /api/admin/properties` — יצירת נכס
- `PATCH/DELETE /api/admin/properties/[id]` — עדכון/מחיקה
- `POST /api/admin/upload-images` — העלאה ל-Supabase Storage

### SiteManager (`scripts/site-manager/`) — ⏭️ דחוי
- קוד קיים, npm install בוצע — נדחה להמשך

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

## ⏭️ הצעד הבא — סוכן הקונים
**הפוקוס הבא: Buyers Agent** — סוכן AI לקונים/שוכרים באתר

רעיון: קונה מתאר מה הוא מחפש בשפה טבעית → הסוכן מחפש נכסים מתאימים (pgvector similarity search), שואל שאלות הבהרה, ומציג תוצאות.

### אפשרויות מימוש:
1. **Chat widget באתר** — floating button → chat panel → Claude API stream
2. **WhatsApp bot** — Claude + Twilio (כבר יש env vars)
3. **שניהם** — chat באתר + WhatsApp

### מה נדרש:
- `embedding` column ב-properties כבר קיים (vector(1536))
- צריך: לחשב embeddings לכל נכס, endpoint לחיפוש semantic, UI לצ'אט

## Domain Migration — כשעוברים לדומיין
Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_SITE_URL = https://mango-realty.com
```
→ Redeploy. הכל מתעדכן אוטומטית (canonical, og, sitemap, JSON-LD).
