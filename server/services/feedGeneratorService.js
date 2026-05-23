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

// ── CSV escape (RFC 4180 standard) ────────────────────────────
function csvEscape(str, qualifier = '"') {
  const s = String(str ?? '');
  return `${qualifier}${s.replace(new RegExp(qualifier, 'g'), `${qualifier}${qualifier}`)}${qualifier}`;
}

// ── Newline cleaner ───────────────────────────────────────────
function cleanNewlines(str) {
  return String(str ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── DB internal fields ────────────────────────────────────────
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
  'keyword_optimization_status',
  'google_category_optimization_status',
  'is_active',
  'item_code',
]);

// ── GMC Field Name Mapping ────────────────────────────────────
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
};

// ── null / empty check ────────────────────────────────────────
function isEmpty(val) {
  return val === null || val === undefined || val === '' || val === 'null';
}

// ── Google Shopping XML ───────────────────────────────────────
function generateXML(products, feed) {
  const currency = feed.format_subtype_currency || 'INR';
  const tracking = feed.output_feed_tracking ? `?${feed.output_feed_tracking}` : '';

  const specialFields = new Set([
    'sourceId', 'product_name', 'description',
    'product_url', 'stock', 'price', 'was_price',
  ]);

  const items = products.map(p => {
    const price    = p.price != null ? `${p.price} ${currency}` : null;
    const wasPrice = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0
                   ? `${Number(p.was_price)} ${currency}` : null;
    const avail    = p.stock > 0 ? 'in stock' : 'out of stock';
    const link     = (feed.output_link_text || p.product_url || '') + tracking;
    const title    = feed.output_title_text || p.product_name || '';
    const desc     = feed.output_desc_text  || p.description  || '';

    const dynamicTags = Object.entries(p)
      .filter(([key, val]) =>
        !SKIP_FIELDS.has(key) &&
        !specialFields.has(key) &&
        !isEmpty(val)
      )
      .map(([key, val]) => {
        const mappedKey = GMC_FIELD_MAP[key] || key;
        return `<g:${mappedKey}>${escapeXml(cleanNewlines(String(val)))}</g:${mappedKey}>`;
      })
      .join('\n      ');

    return `
    <item>
      <g:id>${escapeXml(p.sourceId)}</g:id>
      <g:title>${escapeXml(cleanNewlines(title))}</g:title>
      <g:description>${escapeXml(cleanNewlines(desc))}</g:description>
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

  // Always double quote (RFC 4180)
  const qualifier = feed.op_text_qualifier === 'single' ? "'" : '"';
  const q = (val) => csvEscape(cleanNewlines(String(val ?? '')), qualifier);

  const allKeys = new Set();
  products.forEach(p => {
    Object.keys(p).forEach(key => {
      if (!SKIP_FIELDS.has(key)) allKeys.add(key);
    });
  });

  const fixedCols = [
    'sourceId',
    'product_name',
    'description',
    'product_url',
    'product_image',
    'additional_image1',
    'additional_image2',
    'additional_image3',
    'additional_image4',
    'additional_image5',
    'additional_image6',
    'additional_image7',
    'additional_image8',
    'price',
    'was_price',
    'stock',
    'brand',
    'google_category',
    'ean_id',
    'color',
    'material',
    'pattern',
    'age_group',
    'gender',
    'category',
  ];

  const remainingCols = [...allKeys]
    .filter(k => !fixedCols.includes(k))
    .sort();

  const allCols = [
    ...fixedCols.filter(k => allKeys.has(k)),
    ...remainingCols,
  ];

  // ── Header — GMC mapped name ──────────────────────────────
  const headerRow = allCols
    .map(k => GMC_FIELD_MAP[k] || k)
    .join(',');

  // ── Rows ──────────────────────────────────────────────────
  const rows = products.map(p => {
    return allCols.map(key => {
      if (key === 'sourceId')     return q(p.sourceId || '');
      if (key === 'product_name') return q(feed.output_title_text || p.product_name || '');
      if (key === 'description')  return q(feed.output_desc_text  || p.description  || '');
      if (key === 'product_url')  return q((feed.output_link_text || p.product_url  || '') + tracking);
      if (key === 'stock')        return q(p.stock > 0 ? 'in stock' : 'out of stock');
      if (key === 'price')        return q(p.price != null ? `${p.price} ${currency}` : '');
      if (key === 'was_price') {
        const valid = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0;
        return q(valid ? `${Number(p.was_price)} ${currency}` : '');
      }
      if (isEmpty(p[key])) return q('');
      return q(String(p[key]));
    }).join(',');
  });

  const lines = feed.is_header === '1'
    ? [headerRow, ...rows]
    : rows;

  // \r\n — GMC Windows compatible
  return lines.join('\r\n');
}

// ── Main generate function ────────────────────────────────────
async function generateFeedFile({ tenantDb, feed }) {
  const fmt    = await FeedFormat.findOne({ feed_id: feed.output_format_id });
  const ext    = fmt?.feed_format || 'xml';
  const folder = fmt?.feed_folder || 'gb';

  const products = await tenantDb
    .collection('products')
    .find({ 
      is_active: true,
      field_optimization_status: 'done'  
    })
    .toArray();

  const excludedCount = await tenantDb
    .collection('products')
    .countDocuments({ 
      is_active: true, 
      field_optimization_status: { $ne: 'done' }
    });

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

  return { fileurl, filename, publicUrl, productCount: products.length, excludedCount };
}

module.exports = { generateFeedFile };
