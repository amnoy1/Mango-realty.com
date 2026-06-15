#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   מנהל האתר — Mango Realty Site Manager Agent              ║
 * ║   Runs daily via Windows Task Scheduler                     ║
 * ║                                                             ║
 * ║   Flow:                                                     ║
 * ║   1. Scan WATCH_FOLDER for new property subfolders          ║
 * ║   2. Read text file → Claude extracts structured data       ║
 * ║   3. Send WhatsApp approval request via Twilio              ║
 * ║   4. On next run: check for reply → upload to Supabase      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';

const fs   = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const Anthropic         = require('@anthropic-ai/sdk');
const twilio            = require('twilio');
const { createClient }  = require('@supabase/supabase-js');

// ── Validate required env vars ────────────────────────────────────────────
const SKIP_WHATSAPP = process.env.SKIP_WHATSAPP === 'true';

const REQUIRED_BASE = ['WATCH_FOLDER', 'ANTHROPIC_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const REQUIRED_WHATSAPP = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM', 'ADMIN_WHATSAPP'];
const REQUIRED = SKIP_WHATSAPP ? REQUIRED_BASE : [...REQUIRED_BASE, ...REQUIRED_WHATSAPP];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  console.error('   Copy .env.example to .env and fill in your credentials.');
  process.exit(1);
}

if (SKIP_WHATSAPP) {
  console.log('⚠️  SKIP_WHATSAPP=true — נכסים יועלו ישירות ללא אישור WhatsApp\n');
}

const WATCH_FOLDER    = process.env.WATCH_FOLDER;
const SITE_URL        = process.env.SITE_URL || 'https://mango-realty.com';
const STATE_FILE      = path.join(__dirname, 'state.json');
const SUPABASE_BUCKET = 'property-images';

const claude   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const tw       = !SKIP_WHATSAPP ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── State file ─────────────────────────────────────────────────────────────
// state.json tracks which folders have been handled to avoid reprocessing.
//
// Shape:
// {
//   processed: string[],           // folder names successfully published
//   rejected:  string[],           // folder names rejected by admin
//   pending: Array<{
//     folderName:    string,
//     folderPath:    string,
//     messageSid:    string,        // Twilio SID of the approval WhatsApp
//     sentAt:        string,        // ISO timestamp
//     extractedData: object,        // Claude output
//   }>
// }

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { processed: [], pending: [], rejected: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { processed: [], pending: [], rejected: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── Folder scanning ────────────────────────────────────────────────────────
function scanPropertyFolders() {
  if (!fs.existsSync(WATCH_FOLDER)) {
    console.error(`❌ WATCH_FOLDER does not exist: ${WATCH_FOLDER}`);
    process.exit(1);
  }
  return fs.readdirSync(WATCH_FOLDER, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ name: e.name, fullPath: path.join(WATCH_FOLDER, e.name) }));
}

// Find the main text description file in the property folder root
function findTextFile(folderPath) {
  const files = fs.readdirSync(folderPath);
  return files
    .filter(f => {
      const full = path.join(folderPath, f);
      return fs.statSync(full).isFile() && /\.(txt|docx|doc)$/i.test(f);
    })
    .map(f => path.join(folderPath, f))[0] || null;
}

// Read .txt file; read .docx via mammoth
async function readTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  if (ext === '.docx' || ext === '.doc') {
    const mammoth = require('mammoth');
    const result  = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

// Return all images from the selected photos subfolder.
// Supports multiple naming conventions used in practice.
function findSelectedPhotos(folderPath) {
  const PHOTOS_ROOT = path.join(folderPath, 'תמונות');
  if (!fs.existsSync(PHOTOS_ROOT)) return [];

  // Try these subfolder names in order
  const candidates = ['תמונות נבחרות', 'נבחרו', 'נבחרות', 'selected'];
  for (const name of candidates) {
    const dir = path.join(PHOTOS_ROOT, name);
    if (fs.existsSync(dir)) {
      return fs.readdirSync(dir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .sort()
        .map(f => path.join(dir, f));
    }
  }
  return [];
}

// ── Claude: extract structured property data ───────────────────────────────
async function extractPropertyData(textContent, folderName) {
  const prompt = `אתה עוזר נדל"ן מקצועי של חברת Mango Realty. נתח את תיאור הנכס הבא וחלץ ממנו נתונים מובנים.

שם התיקייה (שם הנכס): ${folderName}

תוכן קובץ הנכס:
---
${textContent}
---

החזר JSON בלבד, ללא הסבר, ללא מרכאות בחוץ, ללא code blocks. JSON בלבד:
{
  "slug": "english-kebab-case-slug-based-on-address",
  "title": "כתובת מלאה בעברית",
  "street": "שם רחוב ומספר",
  "city": "עיר",
  "neighborhood": "שכונה (אם ידועה, אחרת null)",
  "price": 0,
  "price_type": "sale",
  "property_type": "apartment",
  "rooms": 0,
  "bathrooms": 0,
  "area_sqm": 0,
  "floor": null,
  "total_floors": null,
  "description": "תיאור שיווקי מקצועי ומשכנע של הנכס, 2-4 משפטים",
  "features": {
    "parking": false,
    "balcony": false,
    "elevator": false,
    "storage": false,
    "renovated": false,
    "aircon": false,
    "saferoom": false,
    "garden": false
  },
  "whatsapp_summary": "סיכום קצר 2-3 שורות לאישור ב-WhatsApp"
}

כללים:
- slug: תרגם את הכתובת לאנגלית, למשל "rappaport-3-kfar-saba"
- price: מספר שלם בשקלים, ללא פסיקים
- price_type: "sale" למכירה, "rent" להשכרה
- property_type: "apartment" / "house" / "commercial" / "land"
- rooms: כולל חצאי חדרים (4.5)
- אם פרט לא ידוע → null`;

  const response = await claude.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON if wrapped in markdown
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Claude returned invalid JSON:\n' + raw);
  }
}

// ── Twilio WhatsApp ────────────────────────────────────────────────────────
async function sendApprovalRequest(data) {
  const priceStr = data.price
    ? `₪${Number(data.price).toLocaleString('he-IL')}`
    : 'מחיר לא צויין';

  const roomsStr = data.rooms ? `${data.rooms} חדרים` : '';
  const areaStr  = data.area_sqm ? `${data.area_sqm} מ"ר` : '';
  const floorStr = data.floor ? `קומה ${data.floor}` : '';
  const details  = [roomsStr, areaStr, floorStr].filter(Boolean).join(' | ');

  const body = [
    `🏠 *נכס חדש לפרסום*`,
    ``,
    `📍 ${data.title}`,
    `💰 ${priceStr}`,
    details ? `🔑 ${details}` : null,
    ``,
    data.whatsapp_summary,
    ``,
    `────────────────`,
    `✅ השב *אישור* לאישור ופרסום`,
    `❌ השב *דחייה* לדחיית הנכס`,
  ].filter(l => l !== null).join('\n');

  const msg = await tw.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   process.env.ADMIN_WHATSAPP,
    body,
  });

  return msg.sid;
}

async function sendPublishedNotification(data) {
  const url = `${SITE_URL}/properties/${data.slug}`;
  await tw.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   process.env.ADMIN_WHATSAPP,
    body: `✅ *הנכס פורסם בהצלחה!*\n\n📍 ${data.title}\n\n🔗 ${url}`,
  });
}

// Poll Twilio for a reply from admin after sentAt timestamp
async function checkForAdminReply(sentAt) {
  const after = new Date(sentAt);
  // Fetch inbound messages from admin
  const messages = await tw.messages.list({
    from:          process.env.ADMIN_WHATSAPP,
    to:            process.env.TWILIO_WHATSAPP_FROM,
    dateSentAfter: after,
    limit:         20,
  });

  // Find first reply after we sent the approval request
  const reply = messages
    .filter(m => new Date(m.dateSent) > after)
    .sort((a, b) => new Date(a.dateSent) - new Date(b.dateSent))[0];

  if (!reply) return null;

  const body = reply.body.trim().toLowerCase();
  if (body.includes('אישור') || body === '1' || body === 'yes') return 'approved';
  if (body.includes('דחייה') || body === '0' || body === 'no')  return 'rejected';
  return null; // unrecognized reply — keep pending
}

// ── Supabase upload ────────────────────────────────────────────────────────
async function uploadImagesToStorage(data, photoPaths) {
  const urls = [];

  for (const photoPath of photoPaths) {
    const fileName = `${data.slug}/${path.basename(photoPath)}`;
    const buffer   = fs.readFileSync(photoPath);
    const ext      = path.extname(photoPath).slice(1).toLowerCase();
    const mime     = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
                   : ext === 'png'  ? 'image/png'
                   : ext === 'webp' ? 'image/webp'
                   : 'image/jpeg';

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, buffer, { contentType: mime, upsert: true });

    if (error) {
      console.warn(`  ⚠️  Image upload failed: ${path.basename(photoPath)} — ${error.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    urls.push(urlData.publicUrl);
    console.log(`  📸 Uploaded: ${path.basename(photoPath)}`);
  }

  return urls;
}

async function insertProperty(data, imageUrls) {
  const row = {
    slug:            data.slug,
    title:           data.title,
    description:     data.description,
    price:           data.price || null,
    price_type:      data.price_type   || 'sale',
    property_type:   data.property_type || 'apartment',
    status:          'active',
    rooms:           data.rooms        || null,
    bathrooms:       data.bathrooms    || null,
    area_sqm:        data.area_sqm     || null,
    floor:           data.floor        || null,
    total_floors:    data.total_floors || null,
    city:            data.city         || null,
    neighborhood:    data.neighborhood || null,
    street:          data.street       || null,
    features:        data.features     || {},
    images:          imageUrls,
    published_at:    new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from('properties')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return inserted;
}

// ── Main orchestrator ──────────────────────────────────────────────────────
async function main() {
  const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  console.log(`\n${'═'.repeat(56)}`);
  console.log(`  מנהל האתר — ${now}`);
  console.log(`${'═'.repeat(56)}\n`);

  const state     = loadState();
  const handled   = new Set([
    ...state.processed,
    ...state.rejected,
    ...state.pending.map(p => p.folderName),
  ]);

  // ── Phase 1: Detect and send new properties for approval ─────────────────
  const folders = scanPropertyFolders();
  const newFolders = folders.filter(f => !handled.has(f.name));
  console.log(`📁 Found ${folders.length} folders, ${newFolders.length} new\n`);

  for (const folder of newFolders) {
    console.log(`▶ Processing: ${folder.name}`);

    const textFilePath = findTextFile(folder.fullPath);
    if (!textFilePath) {
      console.log(`  ⚠️  No text file found — skipping\n`);
      continue;
    }

    try {
      const textContent = await readTextFile(textFilePath);
      console.log(`  📄 Read text file (${textContent.length} chars)`);

      const data = await extractPropertyData(textContent, folder.name);
      console.log(`  🤖 Claude extracted: ${data.title} — ₪${data.price?.toLocaleString()}`);

      const photos = findSelectedPhotos(folder.fullPath);
      console.log(`  📸 Selected photos: ${photos.length}`);

      if (SKIP_WHATSAPP) {
        // Bypass mode: upload directly without approval
        console.log(`  ⚡ Bypass mode — uploading directly...`);
        const imageUrls = await uploadImagesToStorage(data, photos);
        await insertProperty(data, imageUrls);
        state.processed.push(folder.name);
        console.log(`  🚀 Published: ${SITE_URL}/properties/${data.slug}\n`);
      } else {
        const messageSid = await sendApprovalRequest(data);
        console.log(`  📱 Approval sent (SID: ${messageSid})\n`);
        state.pending.push({
          folderName:    folder.name,
          folderPath:    folder.fullPath,
          messageSid,
          sentAt:        new Date().toISOString(),
          extractedData: data,
        });
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }
  }

  // ── Phase 2: Check pending items for admin replies ────────────────────────
  const stillPending = [];

  if (state.pending.length > 0) {
    console.log(`⏳ Checking ${state.pending.length} pending approval(s)...\n`);
  }

  for (const item of state.pending) {
    console.log(`▶ Pending: ${item.folderName}`);
    const reply = await checkForAdminReply(item.sentAt);

    if (reply === 'approved') {
      console.log(`  ✅ Approved! Uploading to Supabase...`);
      try {
        const photos    = findSelectedPhotos(item.folderPath);
        const imageUrls = await uploadImagesToStorage(item.extractedData, photos);
        await insertProperty(item.extractedData, imageUrls);
        await sendPublishedNotification(item.extractedData);
        state.processed.push(item.folderName);
        console.log(`  🚀 Published: ${SITE_URL}/properties/${item.extractedData.slug}\n`);
      } catch (err) {
        console.error(`  ❌ Upload failed: ${err.message}`);
        stillPending.push(item); // retry next run
      }
    } else if (reply === 'rejected') {
      console.log(`  🚫 Rejected by admin\n`);
      state.rejected.push(item.folderName);
    } else {
      console.log(`  ⏸  No reply yet — will check next run\n`);
      stillPending.push(item);
    }
  }

  state.pending = stillPending;
  saveState(state);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('─'.repeat(56));
  console.log(`📊 Summary:`);
  console.log(`   New sent for approval : ${newFolders.length}`);
  console.log(`   Awaiting reply        : ${state.pending.length}`);
  console.log(`   Total published       : ${state.processed.length}`);
  console.log(`   Total rejected        : ${state.rejected.length}`);
  console.log('─'.repeat(56) + '\n');
}

main().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
