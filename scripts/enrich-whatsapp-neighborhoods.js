'use strict';

/**
 * Backfill: enrich whatsapp_properties rows with correct neighborhood names.
 * Uses a constrained prompt — Haiku must pick from the real KS neighborhood list.
 *
 * Before running, clear wrong data:
 *   UPDATE whatsapp_properties SET neighborhood = NULL;
 *
 * Run:
 *   node --env-file=.env.local scripts/enrich-whatsapp-neighborhoods.js
 */

const https            = require('https');
const Anthropic        = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { lookupNeighborhood } = require('./whatsapp-scraper/src/ks-streets-lookup');

function extractStreetNameSimple(address) {
  return address.trim()
    .replace(/^(רחוב|שד'|שדרות|סמטת|משעול|דרך)\s+/i, '')
    .replace(/\s+\d+.*$/, '').trim() || null;
}

async function lookupDBNeighborhood(supabase, address, city) {
  if (!address || !city) return null;
  const street = extractStreetNameSimple(address);
  if (!street) return null;
  try {
    const { data } = await supabase
      .from('street_neighborhoods')
      .select('neighborhood')
      .eq('city', city)
      .eq('street', street)
      .maybeSingle();
    return data?.neighborhood || null;
  } catch { return null; }
}

async function lookupNominatim(address, city) {
  return new Promise((resolve) => {
    const q   = encodeURIComponent(`${address}, ${city}, ישראל`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&accept-language=he&countrycodes=il&limit=1`;
    const req = https.get(url, { headers: { 'User-Agent': 'MangoRealty-Scraper/1.0 (private use)' } }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          const hood = r[0]?.address?.neighbourhood || null;
          resolve(hood && hood.length < 60 ? hood : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ANTHROPIC_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const claude   = new Anthropic({ apiKey: ANTHROPIC_KEY });
const MODEL    = 'claude-haiku-4-5-20251001';

// Real neighborhoods from the official Kfar Saba city map (KS MAP.pdf)
const KS_NEIGHBORHOODS = [
  'קפלן', 'כפר סבא הצעירה', 'גני השרון', 'גבעת אשכול', 'בית ונוף', 'הדרים',
  'סביוני הכפר', 'כפר סבא הירוקה', 'סירקין', 'ותיקים', 'אמפר',
  'מרכז העיר', 'חצרות הדר', 'מצקין', 'כיסופים',
  'ראשונים', 'גאולים', 'אלי כהן', 'תקומה', 'דגניה',
  'הפועלים', 'מאוריציוס', 'שבזי', 'עובד בן עמי', 'גינת הלימון',
  'אליעזר', 'יוספטל', 'למפרט', 'מעוז',
];

const CITY_NEIGHBORHOODS = {
  'כפר סבא': KS_NEIGHBORHOODS,
};

async function getNeighborhood(address, city) {
  const neighborhoods = CITY_NEIGHBORHOODS[city];
  if (!neighborhoods) return null;

  const listStr = neighborhoods.join(', ');

  const response = await claude.messages.create({
    model:      MODEL,
    max_tokens: 60,
    system:     `אתה מומחה לגיאוגרפיה של ${city}. ענה בשם השכונה בלבד, בדיוק כפי שמופיע ברשימה, ללא שום הסבר נוסף. אם לא ידוע - ענה: לא ידוע.`,
    messages:   [{
      role:    'user',
      content: `ב${city} יש את השכונות הבאות: ${listStr}.\n\nהכתובת: "${address}" — באיזו שכונה ברשימה?`,
    }],
  });

  const raw = response.content[0]?.text?.trim();
  // Validate: must be one of the real neighborhoods
  return neighborhoods.find(n => raw && raw.includes(n)) || null;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('\n🏘️  Enriching whatsapp_properties with verified neighborhoods...\n');
  console.log('   Neighborhood list:');
  KS_NEIGHBORHOODS.forEach(n => console.log(`   • ${n}`));
  console.log('');

  const { data: rows, error } = await supabase
    .from('whatsapp_properties')
    .select('id, address, city')
    .is('neighborhood', null)
    .not('address', 'is', null)
    .not('city', 'is', null);

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('✅ No rows need enrichment.\n');
    process.exit(0);
  }

  console.log(`Found ${rows.length} rows to enrich.\n`);

  const stats = { ok: 0, unknown: 0, failed: 0 };

  for (const row of rows) {
    try {
      // Tier 0: DB lookup — manually curated, most accurate
      let neighborhood = await lookupDBNeighborhood(supabase, row.address, row.city);
      // Tier 1: Nominatim — OSM-based, government-quality boundaries (free)
      if (!neighborhood) neighborhood = await lookupNominatim(row.address, row.city);
      await sleep(1100); // Nominatim: max 1 req/sec
      // Tier 2: Static lookup table
      if (!neighborhood) neighborhood = lookupNeighborhood(row.address, row.city);
      // Tier 3: Constrained Haiku (must pick from real neighborhood list)
      if (!neighborhood) neighborhood = await getNeighborhood(row.address, row.city);

      if (neighborhood) {
        const { error: updateError } = await supabase
          .from('whatsapp_properties')
          .update({ neighborhood })
          .eq('id', row.id);

        if (updateError) throw updateError;

        console.log(`✓ ${row.address} → ${neighborhood}`);
        stats.ok++;
      } else {
        console.log(`? ${row.address} — לא ידוע (skipped)`);
        stats.unknown++;
      }
    } catch (err) {
      console.error(`✗ ${row.address} — ${err.message}`);
      stats.failed++;
    }

    await sleep(300);
  }

  console.log('\n' + '─'.repeat(40));
  console.log(`✅ Done — enriched: ${stats.ok}, unknown: ${stats.unknown}, failed: ${stats.failed}\n`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
