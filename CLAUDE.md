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

## מה בנוי (סטטוס 2026-06-18)

### Public Site
- Homepage: Navbar, Hero, Stats, FeaturedProperties, AIAgentSection, Neighborhoods, HowItWorks, Footer
- `/properties/[slug]` — דף נכס: gallery slider, Google Maps embed, Street View popup, agent card
- `FeaturedProperties` — server component, מושך נכסים אמיתיים מ-Supabase

### Admin Panel (`/admin`)
- Google OAuth — רק `amir@mango-realty.com` נכנס
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
- `.env` נדרש: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, Twilio vars
- הרצה: `node index.js` | בדיקה ללא WhatsApp: `SKIP_WHATSAPP=true node index.js`

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

## ⚠️ פעולה ידנית שטרם בוצעה
**Google OAuth ב-Supabase Dashboard** (נדרש לפני שהAdmin עובד):
1. Supabase → Authentication → Providers → Google → Enable + Client ID/Secret
2. Google Cloud Console → Authorized redirect URI: `https://sgrphwunigmsdtbmilgd.supabase.co/auth/v1/callback`
3. Supabase → URL Configuration → Site URL: `https://mango-realty-com.vercel.app`
4. Redirect URLs: `https://mango-realty-com.vercel.app/auth/callback`

## Phase הבא (Phase 2)
1. `/properties` — דף חיפוש עם פילטרים
2. AI Search — חיפוש בשפה טבעית + pgvector
3. Google Auth לקונים
4. WhatsApp Agent — Claude + Twilio
5. SEO — JSON-LD schema, sitemap
