const crypto = require('crypto');

function generateCustomLabelId(tenantId) {
  const timestamp = Math.floor(Date.now() / 1000);
  // PHP strtotime("now") → unix seconds

  const raw = `${tenantId}_${timestamp}`;
  // "shopyfeststore_1741862097"

  return crypto.createHash('md5').update(raw).digest('hex');
  // "9ae4cf7c1f268e22eb23ed34b55e477d"
}

module.exports = { generateCustomLabelId };
