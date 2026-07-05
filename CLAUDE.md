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

## מה בנוי (סטטוס 2026-07-01)

### Public Site
- **Navbar** — גלובלי ב-`app/layout.tsx` דרך `ConditionalNavbar` (מוסתר על /admin)
  - לינקים חכמים: בדף הבית → גוללים לסקשן, מעמוד אחר → מנווטים לדף
  - "הצוות" → `/team`
- **Homepage**: Hero, Stats, FeaturedProperties, AIAgentSection, Neighborhoods, HowItWorks, Footer
- `/properties` — רשימת כל הנכסים
- `/properties/[slug]` — דף נכס מלא:
  - Gallery slider + thumbnails
  - Google Maps embed (iframe, ללא key) + **Street View modal** (Embed API v1, דורש `NEXT_PUBLIC_GOOGLE_MAPS_KEY`)
    - אם יש key → modal מוטמע; אם אין → tab חדש עם `layer=c`
    - Key מועבר מ-server component (`page.tsx`) כ-prop ל-`PropertyPageClient`
  - Stats bar (חדרים, אמבטיות, מ"ר, קומה)
  - יתרונות הנכס — chips עם אייקונים
  - **כרטיס סוכן מטפל** — תמונה, שם, טלפון, כפתור WhatsApp ירוק → `wa.me/972...`
  - סקשין שכונה — accordion AI (תחבורה, חתך סוציו-אקונומי, מסחר, חינוך) + cache 6 חודשים
  - Related properties
- `/team` — עמוד צוות: גריד כל הסוכנים
- `/team/[slug]` — עמוד סוכן: ביו + נכסים בטיפול + כפתורי WhatsApp/טלפון/מייל + SEO/GEO + city per agent
- `/neighborhoods` — רשימת שכונות (server component, מ-Supabase)
- `/neighborhoods/[id]` — דף שכונה: hero image + NeighborhoodSection AI + "שכונות נוספות"

### Admin Panel (`/admin`) — ✅ מוכן לשימוש
- **כתובת אחת**: `/admin/login` → `/admin` — דשבורד מאוחד
- Google OAuth — רק `amir@mango-realty.com` נכנס
- כפתור **יציאה** ב-header
- **Tabs בדשבורד**:
  - **נכסים** — טבלה עם עריכה / צפייה / מחיקה + "נכס חדש"
  - **צוות** — טבלה עם עריכה / צפייה / מחיקה + "סוכן חדש"
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

### DB — שינויים ידניים שבוצעו
- `DROP CONSTRAINT properties_property_type_check`
- טבלת `neighborhoods` + עמודות: transport, socioeconomic, commerce, schools
- טבלת `agents` — `license_number TEXT` + `city TEXT` (ALTER TABLE בוצע)
- עמודה `agent_id` ב-`properties` (FK → agents.id)
- ⚠️ **עדיין צריך להריץ**: `ALTER TABLE agents ADD COLUMN IF NOT EXISTS photo_position TEXT DEFAULT 'top'`

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
- `POST /api/admin/properties` — יצירת נכס + auto-trigger neighborhood
- `PATCH/DELETE /api/admin/properties/[id]` — עדכון/מחיקה + auto-trigger neighborhood
- `POST /api/admin/upload-images` — העלאה ל-Supabase Storage
- `GET/POST /api/admin/agents` — רשימה / יצירת סוכן
- `PATCH/DELETE /api/admin/agents/[id]` — עדכון/מחיקה סוכן
- `POST /api/admin/logout` — יציאה מהמערכת
- `GET /api/neighborhood` — ניתוח שכונה (maxDuration=120)
- `POST /api/admin/enhance-description` — שיפור תיאור נכס ע"י Claude (maxDuration=60)

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
```
RLS: public read על `status = 'active'` (properties) ו-agents, service_role לכל השאר.

## ✅ פעולות ידניות שבוצעו
1. ✅ Google OAuth ב-Supabase + redirect URIs
2. ✅ `handle_new_user` trigger עם EXCEPTION handler
3. ✅ `neighborhoods` table + עמודות נוספות (ALTER TABLE)
4. ✅ `agents` table — `license_number TEXT` + `city TEXT` (ALTER TABLE בוצע ידנית)

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
