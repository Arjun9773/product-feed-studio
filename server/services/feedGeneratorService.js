const fs         = require('fs');
const path       = require('path');
const FeedFormat = require('../models/FeedFormat');

// ── XML escape ────────────────────────────────────────────────
function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

// ── CSV escape ────────────────────────────────────────────────
function csvEscape(str, qualifier = '') {
  const s = String(str ?? '');
  if (!qualifier) return s;
  return `${qualifier}${s.replace(new RegExp(qualifier, 'g'), `\\${qualifier}`)}${qualifier}`;
}

// ── DB internal fields — feed-ல் வரக்கூடாதவை ────────────────
const SKIP_FIELDS = new Set([
  '_id',
  '__v',
  'tenantId',
  'feedId',
  'importedAt',
  'updatedAt',
  'deactivatedAt',
  'field_optimization_status',
  'title_optimization_status',
  'is_active',
]);

// ── null / empty check ────────────────────────────────────────
function isEmpty(val) {
  return val === null || val === undefined || val === '' || val === 'null';
}

// ── Google Shopping XML ───────────────────────────────────────
function generateXML(products, feed) {
  const currency = feed.format_subtype_currency || 'INR';
  const tracking = feed.output_feed_tracking ? `?${feed.output_feed_tracking}` : '';

  const items = products.map(p => {
    const price    = p.price != null ? `${p.price} ${currency}` : null;
    const wasPrice = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0
                   ? `${Number(p.was_price)} ${currency}` : null;
    const avail    = p.stock > 0 ? 'in_stock' : 'out_of_stock';
    const link     = (feed.output_link_text || p.product_url || '') + tracking;
    const title    = feed.output_title_text || p.product_name || '';
    const desc     = feed.output_desc_text  || p.description  || '';

    // Special fields — already handled above, dynamic loop-ல் skip பண்ணணும்
    const skipInDynamic = new Set([
      'sourceId', 'product_name', 'description', 'product_url',
      'stock', 'price', 'was_price',
    ]);

    // DB-ல் உள்ள மற்ற எல்லா fields-உம் dynamic-ஆ போகும்
    const dynamicTags = Object.entries(p)
      .filter(([key, val]) =>
        !SKIP_FIELDS.has(key) &&
        !skipInDynamic.has(key) &&
        !isEmpty(val)
      )
      .map(([key, val]) => `<g:${key}>${escapeXml(String(val))}</g:${key}>`)
      .join('\n      ');

    return `
    <item>
      <g:id>${escapeXml(p.sourceId)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:availability>${avail}</g:availability>
      <g:condition>new</g:condition>
      ${price    ? `<g:price>${escapeXml(price)}</g:price>`              : ''}
      ${wasPrice ? `<g:sale_price>${escapeXml(wasPrice)}</g:sale_price>` : ''}
      ${dynamicTags}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(feed.output_feed_name)}</title>
    <link>https://yourapp.com</link>
    <description>Google Shopping Feed - ${feed.cmpid}</description>
    ${items}
  </channel>
</rss>`;
}

// ── Google Shopping CSV ───────────────────────────────────────
function generateCSV(products, feed) {
  const currency  = feed.format_subtype_currency || 'INR';
  const tracking  = feed.output_feed_tracking ? `?${feed.output_feed_tracking}` : '';
  const qualifier = feed.op_text_qualifier === 'double' ? '"'
                  : feed.op_text_qualifier === 'single' ? "'"
                  : '';
  const q = (val) => csvEscape(String(val ?? ''), qualifier);

  // ── எல்லா products-இல் இருந்தும் unique columns collect பண்ணு ──
  const allKeys = new Set();
  products.forEach(p => {
    Object.keys(p).forEach(key => {
      if (!SKIP_FIELDS.has(key)) allKeys.add(key);
    });
  });

  // Fixed columns — இவை முதல்ல வரணும்
  const fixedCols = [
    'sourceId',
    'product_name',
    'description',
    'product_url',
    'additional_image1',
    'additional_image2',
    'additional_image3',
    'additional_image4',
    'additional_image5',
    'additional_image6', // ✅ fixed
    'additional_image7', // ✅ fixed
    'additional_image8', // ✅ fixed
    'price',
    'was_price',
    'stock',
  ];

  // Fixed-ல் இல்லாத மற்றவை alphabetical order-ல்
  const remainingCols = [...allKeys]
    .filter(k => !fixedCols.includes(k))
    .sort();

  const allCols = [
    ...fixedCols.filter(k => allKeys.has(k)),
    ...remainingCols,
  ];

  // ── Rows ──────────────────────────────────────────────────
  const rows = products.map(p => {
    return allCols.map(key => {
      if (key === 'sourceId')     return q(p.sourceId || '');
      if (key === 'product_name') return q(feed.output_title_text || p.product_name || '');
      if (key === 'description')  return q(feed.output_desc_text  || p.description  || '');
      if (key === 'product_url')  return q((feed.output_link_text || p.product_url  || '') + tracking);
      if (key === 'stock')        return q(p.stock > 0 ? 'in_stock' : 'out_of_stock');
      if (key === 'price')        return q(p.price != null ? `${p.price} ${currency}` : '');
      if (key === 'was_price') {
        const valid = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0;
        return q(valid ? `${Number(p.was_price)} ${currency}` : '');
      }

      // Empty-ஆ இருந்தால் empty string
      if (isEmpty(p[key])) return q('');

      return q(String(p[key]));
    }).join(',');
  });

  const lines = feed.is_header === '1'
    ? [allCols.join(','), ...rows]
    : rows;

  return lines.join('\n');
}

// ── Main generate function ────────────────────────────────────
async function generateFeedFile({ tenantDb, feed }) {
  const fmt    = await FeedFormat.findOne({ feed_id: feed.output_format_id });
  const ext    = fmt?.feed_format || 'xml';
  const folder = fmt?.feed_folder || 'gb';

  // ✅ is_active: true — active products மட்டும்
  const products = await tenantDb.collection('products')
    .find({ is_active: true })
    .toArray();

  console.log(`[FEED] Generating ${ext.toUpperCase()} for ${feed.cmpid} — ${products.length} active products`);

  let content;
  switch (ext) {
    case 'csv': content = generateCSV(products, feed); break;
    case 'xml':
    default:    content = generateXML(products, feed); break;
  }

  const dir = path.join(
    __dirname, '..', 'uploads', 'output_feeds',
    folder, feed.cmpid, feed.feedid
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${feed.cmpid}_${folder}_${ext}_output.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');

  const fileurl   = `../uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;
  const publicUrl = `/uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;

  console.log(`[FEED] ✔ File saved: ${filePath}`);
  console.log(`[FEED] ✔ Public URL: ${publicUrl}`);

  return { fileurl, filename, publicUrl, productCount: products.length };
}

module.exports = { generateFeedFile };
