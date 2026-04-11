const { v4: uuidv4 } = require('uuid');

function getTenantId(req) {
  return req.headers['x-tenant-id'] 
    || req.user?.cmpid 
    || req.user?.tenantId 
    || '';
}

function generateFeedId() {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

function now() {
  return new Date();
}

module.exports = { getTenantId, generateFeedId, now };
