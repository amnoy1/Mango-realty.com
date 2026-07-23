# Mango Realty — Project Context

## הפרויקט
אתר נדל"ן high-end עבור אמיר (מתווך, Mango Realty). מתחרה על Compass/KEYZ.
Hebrew-first, RTL, Next.js 15 App Router, Tailwind v4, Supabase, Vercel.

## קישורים
- **GitHub**: https://github.com/amnoy1/Mango-realty.com
- **Live**: https://mango-realty-com.vercel.app
- **Supabase**: https://sgrphwunigmsdtbmilgd.supabase.co (Frankfurt)
- **Working dir**: `c:\מנגו AI\mango-realty.com`

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

## מה בנוי (סטטוס 2026-07-23)

### Public Site
- **Navbar** — גלובלי ב-`app/layout.tsx` דרך `ConditionalNavbar` (מוסתר על /admin)
  - "נכסים" → תמיד `/properties` (לא anchor בעמוד הבית)
  - "הצוות" → `/team`
  - **"מוכרים נכס?"** — כפתור שחור ממולא (primary CTA) → `/sell`
  - "צור קשר" → outline בלבד (secondary)
  - לוגו: 56×56px
- **Homepage**: Hero, Stats, FeaturedProperties, AIAgentSection, Neighborhoods, HowItWorks, Footer
  - **Hero tabs** — "קונים" (gold, active) + "מוכרים נכס?" (glass) מחוברים לשדה החיפוש כטאבים
- `/properties` — רשימת כל הנכסים (סגנון cream כמו /neighborhoods, ללא strip שחור)
- `/properties/[slug]` — דף נכס מלא:
  - Gallery slider + thumbnails
  - Google Maps embed (iframe, ללא key) + **Street View modal** ✅ עובד
    - ⚠️ Embed API `streetview` מקבל **רק lat/lng** — לא כתובת טקסט!
    - `lib/geocode.ts` — `geocodeIsraeliAddress(street, city)` → `{lat,lng}|null`
      - **Primary**: Google Geocoding API (`region=il&language=he`) — כיסוי עברית מלא כולל רחובות נדירים
      - **Fallback**: Nominatim (OSM) — בחינם, ללא key
      - ⚠️ Google Cloud Console: חובה להפעיל **Maps Embed API** + **Geocoding API**
    - `page.tsx` מגאוקד ב-first visit אם אין lat/lng; שומר ל-DB ב-`after()`
    - Admin POST/PATCH מגאוקד synchronously לפני שמירה ל-DB
    - `PropertyPageClient`: embed רק אם יש lat/lng; אחרת → tab חדש עם `layer=c`
    - `radius=500` ב-embed URL (מרחב חיפוש רחב יותר לפנורמה)
  - Stats bar (חדרים, אמבטיות, מ"ר, קומה)
  - יתרונות הנכס — chips עם אייקונים
  - **כרטיס סוכן מטפל** — תמונה, שם, טלפון, כפתור WhatsApp ירוק → `wa.me/972...`
  - סקשין שכונה — accordion AI (תחבורה, חתך סוציו-אקונומי, מסחר, חינוך) + cache 6 חודשים
  - Related properties
- `/team` — עמוד צוות: גריד כל הסוכנים
- `/team/[slug]` — עמוד סוכן: ביו + נכסים בטיפול + כפתורי WhatsApp/טלפון/מייל + SEO/GEO + city per agent
- `/neighborhoods` — רשימת שכונות (server component, מ-Supabase)
- `/neighborhoods/[id]` — דף שכונה: hero image + NeighborhoodSection AI + "שכונות נוספות"
- `/sell` — **עמוד מוכרים** ✅:
  - Hero עם תמונה + CTA scroll לטופס
  - טופס פנייה: שם, טלפון, עיר, סוג נכס, הערות → `POST /api/seller-leads`
  - 4 שלבי תהליך מכירה (dark cards)
  - `app/sell/page.tsx` (server, metadata) + `app/sell/SellPageClient.tsx` (client)

### Admin Panel (`/admin`) — ✅ מוכן לשימוש
- **כתובת אחת**: `/admin/login` → `/admin` — דשבורד מאוחד
- Google OAuth — הרשאות לפי תפקיד (`lib/admin-auth.ts`):
  - **Full Admin** `amir@mango-realty.com` — גישה מלאה לכל כולל ניהול סוכנים
  - **Agent** `dorsur76@gmail.com` — נכסים + שכונות + AI; טאב "צוות" מוסתר + API חסום
  - `isAdmin()` — כניסה כללית לאדמין | `isFullAdmin()` — ניהול סוכנים בלבד
- כפתור **יציאה** ב-header
- **Tabs בדשבורד**:
  - **נכסים** — טבלה עם עריכה / צפייה / מחיקה + "נכס חדש"
  - **צוות** — טבלה עם עריכה / צפייה / מחיקה + "סוכן חדש" (Full Admin בלבד)
  - **שכונות** — טבלה עם עריכה (5 שדות: description/transport/socioeconomic/commerce/schools) + מחיקה (hard delete)
  - **לידים** — טבלת לידים מוכרים: שם, טלפון (קישור), עיר, סוג נכס, הערות, תאריך + מחיקה
  - **וואטסאפ** ✅ (2026-07-23) — טבלת נכסים מוואטסאפ מ-`whatsapp_properties` table:
    - כל 16 העמודות; שורות עם `previous_price` מסומנות בענבר (שינוי מחיר)
    - כפתור רענון + כפתור הורדת Excel
    - גרירת עמודות (JS drag via colgroup — CSS resize:horizontal לא אמין ב-RTL)
    - מיון ע"י לחיצה על כותרת עמודה (↑/↓ בצבע מנגו); resize + sort לא מתנגשים (stopPropagation)
- `/admin/properties/new` + `[id]/edit` — טופס נכס מלא
- `/admin/agents/new` + `[id]/edit` — טופס סוכן
- `components/admin/PropertyForm.tsx`:
  - **15 סוגי נכס**, פרטים טכניים, מאפיינים, תיאור
  - **שדה "סוכן מטפל"** — dropdown מטבלת הסוכנים
  - SEO auto-fill, slug auto-generate
- `components/admin/ImageUploader.tsx` — drag & drop עד 20 תמונות
- `components/admin/AgentForm.tsx` — שם/משפחה/טלפון/מייל/תמונה/אודות + **photo_position slider** (0-100 → `top` / `50% X%`)
- **Featured properties** — כפתור ★ באדמין → `features.hero=true` → מוצג בעמוד הבית (עד 3)
- **AI Description Enhancer** — כפתור "✨ שיפור AI" בטופס נכס → panel inline:
  - בוחר קהל: משקיעים / משפחות צעירות / זוגות מבוגרים / כלל הקהל
  - קורא ל-`POST /api/admin/enhance-description` (maxDuration=60)
  - Claude מחזיר description מחודש (150–250 מילים, SEO/GEO) + meta_description
  - אשר → מעדכן שני השדות בטופס; בטל → סוגר ללא שינוי

### שכונות AI — ✅ עובד
- ניתוח אוטומטי ב-4 קטגוריות: תחבורה, חתך סוציו-אקונומי, מסחר+בידור, חינוך + סיכום
- data.gov.il (תחנות אוטובוס בקרבת הנכס) + Claude Sonnet web_search
- Cache 6 חודשים ב-Supabase `neighborhoods` table
- **Auto-trigger**: כשמעלים נכס פעיל באדמין → ניתוח רץ ברקע (next/server `after()`)
- מדור "שכונות מבוקשות" בדף הבית — נכסים אמיתיים מ-Supabase + modal עם ניתוח
- **Bug fix**: `lib/neighborhood.ts` — `.limit(1).order()` במקום `.maybeSingle()` למניעת כישלון שקט כשיש שורות כפולות
- **Bug fix 2**: DB write חייב להיות `await` — fire-and-forget IIFE גרמה לכך שהנתונים לא נשמרו ב-Vercel (lambda נסגרת לפני שה-write מסתיים). השכונה נוצרה מחדש בכל ביקור ולא הופיעה ב-/neighborhoods.

### DB — שינויים ידניים שבוצעו
- `DROP CONSTRAINT properties_property_type_check`
- טבלת `neighborhoods` + עמודות: transport, socioeconomic, commerce, schools
- טבלת `agents` — `license_number TEXT` + `city TEXT` (ALTER TABLE בוצע)
- עמודה `agent_id` ב-`properties` (FK → agents.id)
- ⚠️ **עדיין צריך להריץ**: `ALTER TABLE agents ADD COLUMN IF NOT EXISTS photo_position TEXT DEFAULT 'top'`
- ✅ טבלת `seller_leads` — יצירה + RLS (INSERT לanon בלבד):
  ```sql
  CREATE TABLE seller_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, phone TEXT NOT NULL,
    city TEXT, property_type TEXT, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ALTER TABLE seller_leads ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public_insert" ON seller_leads FOR INSERT TO anon WITH CHECK (true);
  ```

### SEO / GEO — ✅ מלא
- `generateMetadata` לכל נכס: og:image, twitter card, canonical URL
- GEO meta tags: `geo.region=IL`, `geo.placename`, `geo.position`, `ICBM`
- JSON-LD `RealEstateListing` לנכסים, `RealEstateAgent` לסוכנים, `Place` לשכונות
- **Organization JSON-LD** ב-`app/layout.tsx` — brand entity לגוגל (כל עמוד)
- `geo.region=IL` גלובלי ב-`app/layout.tsx` — כל האתר מסומן כישראלי
- `app/robots.ts` — הוראות לסורקים + sitemap reference
- **Favicon**: `app/icon.png` + `app/apple-icon.png` + `public/logo.png` (לוגו מנגו)
- Sitemap: `app/sitemap.ts` — כולל נכסים, סוכנים, שכונות, `/team`, `/neighborhoods`

### API Routes
- `POST /api/admin/properties` — יצירת נכס + auto-geocoding + auto-trigger neighborhood
- `PATCH/DELETE /api/admin/properties/[id]` — עדכון/מחיקה + auto-geocoding + auto-trigger neighborhood
- `POST /api/admin/upload-images` — העלאה ל-Supabase Storage
- `GET/POST /api/admin/agents` — רשימה / יצירת סוכן
- `PATCH/DELETE /api/admin/agents/[id]` — עדכון/מחיקה סוכן
- `PATCH/DELETE /api/admin/neighborhoods/[id]` — עדכון/מחיקת שכונה (hard delete)
- `DELETE /api/admin/seller-leads/[id]` — מחיקת ליד (isAdmin בלבד)
- `POST /api/admin/logout` — יציאה מהמערכת
- `GET /api/neighborhood` — ניתוח שכונה (maxDuration=120)
- `POST /api/admin/enhance-description` — שיפור תיאור נכס ע"י Claude (maxDuration=60)
- `POST /api/seller-leads` — ליד מוכר (public): שמירה ל-DB + מייל Gmail + WhatsApp Twilio

## DB Schema (עיקרי)
```sql
properties: id, slug, title, price, price_type, property_type, status,
            rooms, bathrooms, area_sqm, floor, total_floors,
            city, neighborhood, street, lat, lng,
            features (JSONB), images (text[]),
            agent_id (FK → agents.id),
            meta_title, meta_description, embedding (vector(1536)),
            published_at, created_at, updated_at

agents: id, slug, first_name, last_name, phone, email, photo_url, bio,
        license_number, city, created_at, updated_at

neighborhoods: id, city, neighborhood, description, transport, socioeconomic,
               commerce, schools, image_url, analysis_updated_at, updated_at

seller_leads: id, name, phone, city, property_type, notes, created_at
```
RLS: public read על `status = 'active'` (properties) ו-agents, service_role לכל השאר.

## ✅ פעולות ידניות שבוצעו
1. ✅ Google OAuth ב-Supabase + redirect URIs
2. ✅ `handle_new_user` trigger עם EXCEPTION handler
3. ✅ `neighborhoods` table + עמודות נוספות (ALTER TABLE)
4. ✅ `agents` table — `license_number TEXT` + `city TEXT` (ALTER TABLE בוצע ידנית)
5. ✅ `seller_leads` table + RLS policy (INSERT לanon)
6. ✅ `GMAIL_APP_PASSWORD` — Vercel env var (Google Workspace App Password)
   - ⚠️ nodemailer: חובה להשתמש ב-`host: "smtp.gmail.com", port: 465, secure: true` (לא `service: "gmail"` — לא אמין ב-Vercel serverless)

## ✅ Google OAuth — עובד!
- Login: `app/admin/login/page.tsx` — `flowType: "implicit"` + `redirectTo: /auth/handle`
- Handle: `app/auth/handle/page.tsx` — `getSession()`, redirect ל-`/admin`

## ⏭️ הצעד הבא — סוכן הקונים (Buyers Agent)
קונה מתאר בשפה טבעית → Claude מחפש נכסים (pgvector), שואל שאלות, מציג תוצאות.
- Chat widget באתר + WhatsApp bot (Twilio)
- `embedding` column ב-properties קיים — צריך: embeddings לכל נכס, endpoint לחיפוש, UI

## Domain Migration
```
NEXT_PUBLIC_SITE_URL = https://mango-realty.com
```
→ Redeploy. הכל מתעדכן אוטומטית.
