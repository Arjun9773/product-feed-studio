const fs         = require('fs');
const path       = require('path');
const FeedFormat = require('../models/FeedFormat');

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function csvEscape(str, qualifier = '"') {
  const s = String(str ?? '');
  return `${qualifier}${s.replace(new RegExp(qualifier, 'g'), `${qualifier}${qualifier}`)}${qualifier}`;
}

function cleanNewlines(str) {
  return String(str ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmpty(val) {
  return val === null || val === undefined || val === '' || val === 'null';
}

function appendTracking(url, tracking) {
  if (!tracking) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${tracking}`;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

// DB internal fields — feed-ல வரக்கூடாது
const SKIP_FIELDS = new Set([
  '_id', '__v', 'tenantId', 'feedId',
  'importedAt', 'updatedAt', 'deactivatedAt',
  'field_optimization_status', 'title_optimization_status',
  'keyword_optimization_status', 'google_category_optimization_status',
  'is_active', 'item_code',
  'Shopping_ads_scrape_status',
  'quantity',
]);

// DB field → GMC field name mapping
const GMC_FIELD_MAP = {
  sourceId:          'id',
  product_name:      'title',
  description:       'description',
  product_url:       'link',
  product_image:     'image_link',
  price:             'price',
  was_price:         'sale_price',
  stock:             'availability',
  brand:             'brand',
  google_category:   'google_product_category',
  ean_id:            'gtin',
  color:             'color',
  material:          'material',
  pattern:           'pattern',
  age_group:         'age_group',
  gender:            'gender',
  category:          'product_type',
  additional_image1: 'additional_image_link',
  additional_image2: 'additional_image_link',
  additional_image3: 'additional_image_link',
  additional_image4: 'additional_image_link',
  additional_image5: 'additional_image_link',
  additional_image6: 'additional_image_link',
  additional_image7: 'additional_image_link',
  additional_image8: 'additional_image_link',
};

const ADDITIONAL_IMAGE_KEYS = new Set([
  'additional_image1', 'additional_image2', 'additional_image3', 'additional_image4',
  'additional_image5', 'additional_image6', 'additional_image7', 'additional_image8',
]);

// GMC valid enum values
const VALID_GENDER    = new Set(['male', 'female', 'unisex']);
const VALID_AGE_GROUP = new Set(['newborn', 'infant', 'toddler', 'kids', 'adult']);

// XML-ல manually handle பண்ற fields — dynamic loop-ல skip பண்ணணும்
const XML_SPECIAL_FIELDS = new Set([
  'sourceId', 'product_name', 'description', 'product_url',
  'product_image', 'stock', 'price', 'was_price', 'condition',
  'gender', 'age_group',
  ...ADDITIONAL_IMAGE_KEYS,
]);

// ─────────────────────────────────────────────────────────────
// XML GENERATOR  (FIX: structure + empty tag skip + image_link)
// ─────────────────────────────────────────────────────────────

function generateXML(products, feed) {
  const currency = feed.format_subtype_currency || 'INR';
  const tracking = feed.output_feed_tracking    || '';

  // FIX: <channel><link> → company domain மட்டும் (product URL இல்ல)
  //      feed.company_url = generateFeedFile()-ல DB-ல இருந்து set பண்றோம்
  const channelLink = feed.company_url || 'https://yourapp.com';

  // FIX: Performance — push to array, join once at end (string concat avoid)
  const itemParts = [];

  for (const p of products) {
    // sourceId இல்லன்னா skip
    if (isEmpty(p.sourceId)) continue;

    // ── Core fields ──────────────────────────────────────────
    const id    = escapeXml(p.sourceId);
    const title = escapeXml(cleanNewlines(feed.output_title_text || p.product_name || ''));

    // FIX: <g:link> → always product URL + tracking
    //      feed.output_link_text ஒரு override title/desc மட்டும்; link-க்கு use பண்ணாதே
    const link  = escapeXml(appendTracking(p.product_url || '', tracking));
    const avail = Number(p.stock) > 0 ? 'in stock' : 'out of stock'; // FIX: space not underscore
    const cond  = !isEmpty(p.condition) ? escapeXml(p.condition) : 'new';

    // FIX: description — null string check
    const rawDesc = feed.output_desc_text || p.description || '';
    const desc    = isEmpty(rawDesc) ? '' : escapeXml(cleanNewlines(rawDesc));

    // FIX: image_link — XML_SPECIAL_FIELDS-ல இருக்கு, dynamic loop skip பண்றது;
    //      ஆனா tag manually போடணும்
    const imageTag = !isEmpty(p.product_image)
      ? `<g:image_link>${escapeXml(cleanNewlines(String(p.product_image)))}</g:image_link>`
      : '';

    // ── Price ────────────────────────────────────────────────
    const priceTag = p.price != null
      ? `<g:price>${escapeXml(`${p.price} ${currency}`)}</g:price>`
      : '';

    // FIX: sale_price — price-ஓட same value ஆனா போடாதே
    const wasNum = Number(p.was_price);
    const salePriceTag =
      !isEmpty(p.was_price) && !isNaN(wasNum) && wasNum > 0 && wasNum !== Number(p.price)
        ? `<g:sale_price>${escapeXml(`${wasNum} ${currency}`)}</g:sale_price>`
        : '';

    // ── Additional images ────────────────────────────────────
    const additionalImageTags = [...ADDITIONAL_IMAGE_KEYS]
      .filter(key => !isEmpty(p[key]))
      .map(key =>
        `<g:additional_image_link>${escapeXml(cleanNewlines(String(p[key])))}</g:additional_image_link>`
      )
      .join('\n        ');

    // ── Gender / Age Group — valid values மட்டும் ────────────
    const genderTag = !isEmpty(p.gender) && VALID_GENDER.has(String(p.gender).toLowerCase())
      ? `<g:gender>${escapeXml(p.gender)}</g:gender>` : '';

    const ageGroupTag = !isEmpty(p.age_group) && VALID_AGE_GROUP.has(String(p.age_group).toLowerCase())
      ? `<g:age_group>${escapeXml(p.age_group)}</g:age_group>` : '';

    // ── Dynamic remaining fields ─────────────────────────────
    // FIX: XML_SPECIAL_FIELDS-ல இல்லாத, SKIP_FIELDS-ல இல்லாத, empty இல்லாத மட்டும்
    const dynamicTags = Object.entries(p)
      .filter(([key, val]) =>
        !SKIP_FIELDS.has(key) &&
        !XML_SPECIAL_FIELDS.has(key) &&
        !isEmpty(val)
      )
      .map(([key, val]) => {
        const gmcKey = GMC_FIELD_MAP[key] || key;
        return `<g:${gmcKey}>${escapeXml(cleanNewlines(String(val)))}</g:${gmcKey}>`;
      })
      .join('\n        ');

    // ── Build item string ─────────────────────────────────────
    // FIX: empty tags conditionally include பண்றோம் (no blank lines)
    const tagLines = [
      `<g:id>${id}</g:id>`,
      `<g:title>${title}</g:title>`,
      desc        ? `<g:description>${desc}</g:description>` : '',
      `<g:link>${link}</g:link>`,
      imageTag,
      `<g:availability>${avail}</g:availability>`,
      `<g:condition>${cond}</g:condition>`,
      priceTag,
      salePriceTag,
      additionalImageTags,
      genderTag,
      ageGroupTag,
      dynamicTags,
    ].filter(Boolean).join('\n        ');

    itemParts.push(`\n      <item>\n        ${tagLines}\n      </item>`);
  }

  // FIX: Proper RSS structure — indentation சரி, items channel-க்கு உள்ளே
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${escapeXml(feed.output_feed_name)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>Google Shopping Feed - ${escapeXml(feed.cmpid)}</description>`,
    itemParts.join(''),
    '  </channel>',
    '</rss>',
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// CSV GENERATOR
// ─────────────────────────────────────────────────────────────

function generateCSV(products, feed) {
  const currency  = feed.format_subtype_currency || 'INR';
  const tracking  = feed.output_feed_tracking    || '';
  const qualifier = feed.op_text_qualifier === 'single' ? "'" : '"';
  const q = (val) => csvEscape(cleanNewlines(String(val ?? '')), qualifier);

  // All keys collect பண்று (SKIP_FIELDS தவிர்த்து)
  const allKeys = new Set();
  for (const p of products) {
    for (const key of Object.keys(p)) {
      if (!SKIP_FIELDS.has(key)) allKeys.add(key);
    }
  }

  const fixedCols = [
    'sourceId', 'product_name', 'description', 'product_url', 'product_image',
    'additional_image1', 'additional_image2', 'additional_image3', 'additional_image4',
    'additional_image5', 'additional_image6', 'additional_image7', 'additional_image8',
    'price', 'was_price', 'stock', 'brand', 'google_category', 'ean_id',
    'color', 'material', 'pattern', 'age_group', 'gender', 'category',
  ];

  const remainingCols = [...allKeys]
    .filter(k => !fixedCols.includes(k))
    .sort();

  const allCols = [
    ...fixedCols.filter(k => allKeys.has(k)),
    ...remainingCols,
  ];

  const headerRow = allCols.map(k => GMC_FIELD_MAP[k] || k).join(',');

  // FIX: Performance — push rows to array, join once
  const rows = [];
  for (const p of products) {
    const row = allCols.map(key => {
      if (key === 'sourceId')     return q(p.sourceId || '');
      if (key === 'product_name') return q(feed.output_title_text || p.product_name || '');
      if (key === 'description') {
        const d = feed.output_desc_text || p.description || '';
        return q(isEmpty(d) ? '' : d);
      }
      if (key === 'product_url')
        return q(appendTracking(feed.output_link_text || p.product_url || '', tracking));
      if (key === 'stock')
        return q(Number(p.stock) > 0 ? 'in stock' : 'out of stock'); // FIX: space
      if (key === 'price')
        return q(p.price != null ? `${p.price} ${currency}` : '');
      if (key === 'was_price') {
        const wn = Number(p.was_price);
        const valid = !isEmpty(p.was_price) && !isNaN(wn) && wn > 0 && wn !== Number(p.price);
        return q(valid ? `${wn} ${currency}` : '');
      }
      if (key === 'gender') {
        const valid = !isEmpty(p.gender) && VALID_GENDER.has(String(p.gender).toLowerCase());
        return q(valid ? p.gender : '');
      }
      if (key === 'age_group') {
        const valid = !isEmpty(p.age_group) && VALID_AGE_GROUP.has(String(p.age_group).toLowerCase());
        return q(valid ? p.age_group : '');
      }
      return q(isEmpty(p[key]) ? '' : String(p[key]));
    });
    rows.push(row.join(','));
  }

  const lines = feed.is_header === '1' ? [headerRow, ...rows] : rows;
  return lines.join('\r\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────

async function generateFeedFile({ tenantDb, mainDb, feed }) {
  // Feed format (xml / csv) எடு
  const fmt    = await FeedFormat.findOne({ feed_id: feed.output_format_id });
  const ext    = fmt?.feed_format || 'xml';
  const folder = fmt?.feed_folder || 'gb';

  // FIX: company_url — <channel><link> மட்டும் use பண்ண தனியா set பண்றோம்
  //      output_link_text-ஐ override பண்ணல — அது வேற purpose-க்கு
  if (mainDb) {
    const company = await mainDb
      .collection('companies')
      .findOne({ companyId: feed.cmpid });
    // எப்பவும் DB-ல இருந்து company domain எடு — channel link-க்கு மட்டும்
    feed.company_url = company?.companyUrl || 'https://yourapp.com';
  } else {
    feed.company_url = feed.output_link_text || 'https://yourapp.com';
  }

  console.log('📄 Feed config:', JSON.stringify(feed, null, 2));

  // FIX: Performance — lean() use பண்று memory குறை
  //      is_active + optimized products மட்டும்
  const [products, excludedCount] = await Promise.all([
    tenantDb
      .collection('products')
      .find({ is_active: true, field_optimization_status: 'done' })
      .project({ __v: 0 })           // unnecessary fields DB-லேயே தவிர்
      .lean?.()                       // Mongoose use பண்றா lean(); native driver-ல இல்ல
      .toArray(),

    tenantDb
      .collection('products')
      .countDocuments({
        is_active: true,
        field_optimization_status: { $ne: 'done' },
      }),
  ]);

  console.log(`[FEED] 📦 Products to process: ${products.length} | Excluded: ${excludedCount}`);

  // Generate content
  let content;
  switch (ext) {
    case 'csv': content = generateCSV(products, feed); break;
    case 'xml':
    default:    content = generateXML(products, feed); break;
  }

  // Output folder create + file write
  const dir = path.join(
    __dirname, '..', 'uploads', 'output_feeds',
    folder, feed.cmpid, feed.feedid
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename  = `${feed.cmpid}_${folder}_${ext}_output.${ext}`;
  const filePath  = path.join(dir, filename);

  // FIX: Performance — large file-க்கு writeFile async use பண்ணு (sync block ஆகாம)
  await fs.promises.writeFile(filePath, content, 'utf8');

  const fileurl   = `../uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;
  const publicUrl = `/uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;

  console.log(`[FEED] ✔ File saved  : ${filePath}`);
  console.log(`[FEED] ✔ Public URL  : ${publicUrl}`);

  return { fileurl, filename, publicUrl, productCount: products.length, excludedCount };
}

module.exports = { generateFeedFile };
