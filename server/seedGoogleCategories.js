
//
// Run once manually:
//   node seedGoogleCategories.js
//
// Fetches Google taxonomy from official URL and inserts into main DB.
// Uses updateOne + upsert so it's safe to re-run (no duplicates).

require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');

const TAXONOMY_URL =
  'https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt';

// ── Inline schema (no separate model file needed) ──────────────
const googleCategorySchema = new mongoose.Schema({
  google_taxonomy_id: { type: Number, unique: true },
  name:               { type: String },
}, { collection: 'google_categories' });

const GoogleCategory = mongoose.model('GoogleCategory', googleCategorySchema);

// ── Fetch taxonomy from Google ─────────────────────────────────
function fetchTaxonomy() {
  return new Promise((resolve, reject) => {
    https.get(TAXONOMY_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ── Parse raw text → array of { google_taxonomy_id, name } ────
function parseTaxonomy(raw) {
  return raw
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const dashIdx = line.indexOf(' - ');
      if (dashIdx === -1) return null;
      const id   = parseInt(line.substring(0, dashIdx).trim(), 10);
      const name = line.substring(dashIdx + 3).trim();
      return isNaN(id) || !name ? null : { google_taxonomy_id: id, name };
    })
    .filter(Boolean);
}

// ── Seed ──────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  console.log('Fetching Google taxonomy...');
  const raw  = await fetchTaxonomy();
  const docs = parseTaxonomy(raw);
  console.log(`Parsed ${docs.length} categories`);

  let inserted = 0;
  let skipped  = 0;

  for (const doc of docs) {
    const result = await GoogleCategory.updateOne(
      { google_taxonomy_id: doc.google_taxonomy_id }, 
      { $setOnInsert: doc },                          
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});