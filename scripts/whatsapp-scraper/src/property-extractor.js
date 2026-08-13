'use strict';

const https    = require('https');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { lookupNeighborhood } = require('./ks-streets-lookup');

const _supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function extractStreetNameSimple(address) {
  return address.trim()
    .replace(/^(רחוב|שד'|שדרות|סמטת|משעול|דרך)\s+/i, '')
    .replace(/\s+\d+.*$/, '').trim() || null;
}

async function lookupDBNeighborhood(address, city) {
  if (!_supabase || !address || !city) return null;
  const street = extractStreetNameSimple(address);
  if (!street) return null;
  try {
    const { data } = await _supabase
      .from('street_neighborhoods')
      .select('neighborhood')
      .eq('city', city)
      .eq('street', street)
      .maybeSingle();
    return data?.neighborhood || null;
  } catch { return null; }
}

const client = new Anthropic();
const MODEL  = 'claude-haiku-4-5-20251001';

/**
 * Nominatim reverse geocode lookup (OpenStreetMap).
 * Returns neighbourhood name or null. Respects 1 req/sec policy.
 */
async function lookupNominatim(address, city) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(`${address}, ${city}, ישראל`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&accept-language=he&countrycodes=il&limit=1`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'MangoRealty-Scraper/1.0 (private use)' },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          const hood = results[0]?.address?.neighbourhood || null;
          resolve(hood && hood.length < 60 ? hood : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

const SYSTEM_PROMPT = `אתה מומחה בחילוץ מידע על נכסי נדל"ן מהודעות WhatsApp שנשלחות על ידי מתווכים ישראלים.
המשימה: לנתח הודעה ולהחזיר JSON מערך עם כל הנכסים שמוזכרים בה.
החזר תמיד JSON תקין בלבד, ללא טקסט נוסף.`;

async function extractProperty(block) {
  const userPrompt = `שם השולח: ${block.sender}
תאריך: ${block.date}
הודעה:
${block.text}

חלץ את כל הנכסים מהטקסט לעיל. יכולים להיות נכס אחד או יותר באותה הודעה.
החזר JSON מערך בדיוק בפורמט הבא (גם אם יש נכס אחד בלבד):
[
  {
    "property_type": "דירה" / "פנטהאוז" / "דירת גן" / "דופלקס" / "וילה" / "קוטג'" / "חנות" / "משרד" / "מחסן" / null,
    "address": "כתובת מלאה או חלקית או null",
    "city": "שם עיר או null",
    "area_sqm": מספר שלם או null,
    "balcony_sqm": מספר שלם של שטח מרפסת או גינה (מ"ר) או null,
    "rooms": מספר (כולל חצאים כגון 3.5) או null,
    "floor": מספר או null,
    "price": מספר שלם ללא פסיקים (למשל 2500000) או null,
    "mamad": true/false,
    "parking": 0 או 1 או 2 (מספר חניות — 0 אם אין),
    "storage": true/false,
    "elevator": true/false,
    "broker_name": "שם המתווך",
    "broker_phone": "מספר טלפון ספרות בלבד" או null
  }
]

חוקים:
- החזר מערך ריק [] אם ההודעה אינה על נכסים למכירה/השכרה (שאלה, שיחה, חיפוש וכו')
- broker_name = שם השולח אם לא מופיע שם אחר
- price: "2.5 מיליון" → 2500000, "1.8M" → 1800000, "1,800,000" → 1800000
- rooms: "4 חד'" → 4, "3.5 חד'" → 3.5
- mamad: true רק אם מופיע מפורשות ממ"ד / מרחב מוגן
- parking: ספור חניות מפורשות. 0 אם לא הוזכרו.
- storage: true רק אם מוזכר מפורשות מחסן
- elevator: true רק אם מוזכר מפורשות מעלית
- החזר null עבור שדות שלא נמצאו`;

  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0]?.text?.trim();
    if (!text) return [];

    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const arr      = JSON.parse(jsonText);

    if (!Array.isArray(arr) || arr.length === 0) return [];

    const properties = arr.map(data => ({
      property_type: data.property_type  || null,
      address:       data.address        || null,
      city:          data.city           || null,
      area_sqm:      toNumber(data.area_sqm),
      balcony_sqm:   toNumber(data.balcony_sqm),
      rooms:         toNumber(data.rooms),
      floor:         toNumber(data.floor),
      price:         toNumber(data.price),
      mamad:         Boolean(data.mamad),
      parking:       toParking(data.parking),
      storage:       Boolean(data.storage),
      elevator:      Boolean(data.elevator),
      broker_name:   data.broker_name    || block.sender,
      broker_phone:  cleanPhone(data.broker_phone),
      publish_date:  block.date,
    }));

    // Enrich each extracted property with neighborhood
    const enriched = [];
    for (const p of properties) {
      enriched.push(await enrichNeighborhood(p));
    }
    return enriched;

  } catch (err) {
    if (process.env.DEBUG) {
      console.error(`  [extractor] Error on block from ${block.sender}:`, err.message);
    }
    return [];
  }
}

async function extractProperties(blocks) {
  const results     = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < blocks.length; i += CONCURRENCY) {
    const batch   = blocks.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(extractProperty));
    for (const r of settled) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        results.push(...r.value);
      }
    }
    if (i + CONCURRENCY < blocks.length) await sleep(500);
  }

  return results;
}

// Real neighborhoods from the official Kfar Saba city map (KS MAP.pdf)
const KS_NEIGHBORHOODS = [
  'קפלן', 'כפר סבא הצעירה', 'גני השרון', 'גבעת אשכול', 'בית ונוף', 'הדרים',
  'סביוני הכפר', 'כפר סבא הירוקה', 'סירקין', 'ותיקים', 'אמפר',
  'מרכז העיר', 'חצרות הדר', 'מצקין', 'כיסופים',
  'ראשונים', 'גאולים', 'אלי כהן', 'תקומה', 'דגניה',
  'הפועלים', 'מאוריציוס', 'שבזי', 'עובד בן עמי', 'גינת הלימון',
  'אליעזר', 'יוספטל', 'למפרט', 'מעוז',
];

const KS_NEIGHBORHOODS_STR = KS_NEIGHBORHOODS.join(', ');

/**
 * Ask Claude Haiku for the neighborhood of a given address+city.
 * Uses a constrained prompt — Haiku must pick from the real neighborhood list.
 * Sets property.neighborhood in-place and returns the property.
 */
async function enrichNeighborhood(property) {
  if (!property.address || !property.city) return property;

  // 0. DB lookup — manually curated, most accurate
  const dbResult = await lookupDBNeighborhood(property.address, property.city);
  if (dbResult) {
    property.neighborhood = dbResult;
    return property;
  }

  // 1. Nominatim — free, OSM-based, government-quality boundaries
  const nominatim = await lookupNominatim(property.address, property.city);
  if (nominatim) {
    property.neighborhood = nominatim;
    return property;
  }
  await sleep(1100); // Nominatim requires ≤1 req/sec

  // 2. Static lookup table (230+ streets across 7 KS neighborhoods)
  const staticResult = lookupNeighborhood(property.address, property.city);
  if (staticResult) {
    property.neighborhood = staticResult;
    return property;
  }

  // 3. Constrained Haiku — must pick from the real neighborhood list
  const cityNeighborhoods = property.city === 'כפר סבא' ? KS_NEIGHBORHOODS : null;
  if (!cityNeighborhoods) return property;

  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 60,
      system:     `אתה מומחה לגיאוגרפיה של ${property.city}. ענה בשם השכונה בלבד, בדיוק כפי שמופיע ברשימה, ללא שום הסבר נוסף. אם לא ידוע - ענה: לא ידוע.`,
      messages:   [{
        role:    'user',
        content: `ב${property.city} יש את השכונות הבאות: ${KS_NEIGHBORHOODS_STR}.\n\nהכתובת: "${property.address}" — באיזו שכונה ברשימה?`,
      }],
    });
    const raw = response.content[0]?.text?.trim();
    // Validate: the answer must be one of the known neighborhoods
    const match = cityNeighborhoods.find(n => raw && raw.includes(n));
    if (match) property.neighborhood = match;
  } catch (err) {
    if (process.env.DEBUG) {
      console.error(`  [extractor] Neighborhood lookup failed for ${property.address}:`, err.message);
    }
  }

  return property;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function toNumber(val) {
  if (val === null || val === undefined) return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function toParking(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), 2);
}

function cleanPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('972') && digits.length === 12) return '0' + digits.slice(3);
  return digits;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { extractProperty, extractProperties, enrichNeighborhood };
