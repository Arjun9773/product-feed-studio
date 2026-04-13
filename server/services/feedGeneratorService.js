const fs         = require('fs');
const path       = require('path');
const FeedFormat = require('../models/FeedFormat');

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function csvEscape(str, qualifier = '') {
  const s = String(str ?? '');
  if (!qualifier) return s;
  return `${qualifier}${s.replace(new RegExp(qualifier, 'g'), `\\${qualifier}`)}${qualifier}`;
}

function generateXML(products, feed) {
  const currency = feed.format_subtype_currency || 'INR';
  const tracking = feed.output_feed_tracking ? `?${feed.output_feed_tracking}` : '';

  const items = products.map(p => {
    const wasPrice = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0;

    return `
    <item>
      <g:id>${escapeXml(p.sourceId)}</g:id>
      <g:title>${escapeXml(feed.output_title_text || p.product_name || '')}</g:title>
      <g:description>${escapeXml(feed.output_desc_text || p.description || '')}</g:description>
      <g:link>${escapeXml((feed.output_link_text || p.product_url || '') + tracking)}</g:link>
      <g:image_link>${escapeXml(p.additional_image1 || '')}</g:image_link>
      ${p.price != null ? `<g:price>${p.price} ${currency}</g:price>` : ''}
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      ${p.brand            ? `<g:brand>${escapeXml(p.brand)}</g:brand>` : ''}
      ${p.gtin             ? `<g:gtin>${escapeXml(p.gtin)}</g:gtin>` : ''}
      ${p.google_category  ? `<g:google_product_category>${escapeXml(p.google_category)}</g:google_product_category>` : ''}
      ${p.color            ? `<g:color>${escapeXml(p.color)}</g:color>` : ''}
      ${p.age_group        ? `<g:age_group>${escapeXml(p.age_group)}</g:age_group>` : ''}
      ${p.gender           ? `<g:gender>${escapeXml(p.gender)}</g:gender>` : ''}
      ${p.material         ? `<g:material>${escapeXml(p.material)}</g:material>` : ''}
      ${p.custom_label_0   ? `<g:custom_label_0>${escapeXml(p.custom_label_0)}</g:custom_label_0>` : ''}
      ${wasPrice           ? `<g:sale_price>${Number(p.was_price)} ${currency}</g:sale_price>` : ''}
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

  const rows = products.map(p => {
    const wasPrice = p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0;

    return [
      q(p.sourceId                                                              || ''),
      q(feed.output_title_text || p.product_name                               || ''),
      q(feed.output_desc_text  || p.description                                || ''),
      q((feed.output_link_text || p.product_url || '') + tracking),
      q(p.additional_image1                                                     || ''),
      q(p.price != null ? `${p.price} ${currency}` : ''),
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
      // was_price valid number-ஆ இருந்தால் மட்டும் column சேர்க்கும்
      ...(wasPrice ? [q(`${Number(p.was_price)} ${currency}`)] : []),
    ].join(',');
  });

  // was_price ஏதாவது product-ல் valid-ஆ இருந்தால் header-லயும் சேர்க்கணும்
  const hasWasPrice = products.some(
    p => p.was_price && !isNaN(Number(p.was_price)) && Number(p.was_price) > 0
  );
  const finalHeaders = hasWasPrice ? [...headers, 'sale_price'] : headers;

  const lines = feed.is_header === '1'
    ? [finalHeaders.join(','), ...rows]
    : rows;

  return lines.join('\n');
}

async function generateFeedFile({ tenantDb, feed }) {
  const fmt    = await FeedFormat.findOne({ feed_id: feed.output_format_id });
  const ext    = fmt?.feed_format || 'xml';
  const folder = fmt?.feed_folder || 'gb';

  // ✅ FIX: is_active: true மட்டும் — archived/status field இல்லை DB-ல்
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
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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
