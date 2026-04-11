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

// ── Google Shopping XML ───────────────────────────────────────
function generateXML(products, feed) {
  const currency = feed.format_subtype_currency || 'INR';
  const tracking = feed.output_feed_tracking ? `?${feed.output_feed_tracking}` : '';

  const items = products.map(p => `
    <item>
      <g:id>${escapeXml(p.sourceId)}</g:id>
      <g:title>${escapeXml(feed.output_title_text || p.product_name || '')}</g:title>
      <g:description>${escapeXml(feed.output_desc_text || p.description || '')}</g:description>
      <g:link>${escapeXml((feed.output_link_text || p.product_url || '') + tracking)}</g:link>
      <g:image_link>${escapeXml(p.additional_image1 || '')}</g:image_link>
      <g:price>${p.price ? `${p.price} ${currency}` : ''}</g:price>
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand || '')}</g:brand>
      <g:gtin>${escapeXml(p.gtin || '')}</g:gtin>
      <g:google_product_category>${escapeXml(p.google_category || '')}</g:google_product_category>
      <g:color>${escapeXml(p.color || '')}</g:color>
      <g:age_group>${escapeXml(p.age_group || '')}</g:age_group>
      <g:gender>${escapeXml(p.gender || '')}</g:gender>
      <g:material>${escapeXml(p.material || '')}</g:material>
      ${p.custom_label_0 ? `<g:custom_label_0>${escapeXml(p.custom_label_0)}</g:custom_label_0>` : ''}
      ${p.was_price      ? `<g:sale_price>${p.was_price} ${currency}</g:sale_price>`             : ''}
    </item>`).join('');

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

  const q = (val) => csvEscape(val, qualifier);

  const headers = [
    'id', 'title', 'description', 'link', 'image_link',
    'price', 'availability', 'condition', 'brand', 'gtin',
    'google_product_category', 'color', 'age_group',
    'gender', 'material', 'custom_label_0',
  ];

  const rows = products.map(p => [
    q(p.sourceId),
    q(feed.output_title_text || p.product_name || ''),
    q(feed.output_desc_text  || p.description  || ''),
    q((feed.output_link_text || p.product_url  || '') + tracking),
    q(p.additional_image1    || ''),
    q(p.price ? `${p.price} ${currency}` : ''),
    q(p.stock > 0 ? 'in_stock' : 'out_of_stock'),
    q('new'),
    q(p.brand           || ''),
    q(p.gtin            || ''),
    q(p.google_category || ''),
    q(p.color           || ''),
    q(p.age_group       || ''),
    q(p.gender          || ''),
    q(p.material        || ''),
    q(p.custom_label_0  || ''),
  ].join(','));

  const lines = feed.is_header === '1'
    ? [headers.join(','), ...rows]
    : rows;

  return lines.join('\n');
}

// ── Main generate function ────────────────────────────────────
async function generateFeedFile({ tenantDb, feed }) {
  // 1. FeedFormat fetch
  const fmt    = await FeedFormat.findOne({ feed_id: feed.output_format_id });
  const ext    = fmt?.feed_format || 'xml';
  const folder = fmt?.feed_folder || 'gb';

  // 2. Products fetch
  const products = await tenantDb.collection('products')
    .find({})
    .toArray();

  console.log(`[FEED] Generating ${ext.toUpperCase()} for ${feed.cmpid} — ${products.length} products`);

  // 3. Content generate
  let content;
  switch (ext) {
    case 'csv': content = generateCSV(products, feed); break;
    case 'xml':
    default:    content = generateXML(products, feed); break;
  }

  // 4. Directory create
  const dir = path.join(
    __dirname, '..', 'uploads', 'output_feeds',
    folder, feed.cmpid, feed.feedid
  );
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 5. File save
  const filename = `${feed.cmpid}_${folder}_${ext}_output.${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');

  // 6. URLs
  const fileurl   = `../uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;
  const publicUrl = `/uploads/output_feeds/${folder}/${feed.cmpid}/${feed.feedid}/${filename}`;

  console.log(`[FEED] ✔ File saved: ${filePath}`);
  console.log(`[FEED] ✔ Public URL: ${publicUrl}`);

  return {
    fileurl,
    filename,
    publicUrl,
    productCount: products.length,
  };
}

module.exports = { generateFeedFile };
