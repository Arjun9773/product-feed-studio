const { getTenantDb } = require('../config/db');

const tenantResolver = (req, res, next) => {
  // Super admin passes x-tenant-id to view any store
  // Store admin storeId comes from their JWT token
  const storeId = req.headers['x-tenant-id'] || req.user?.storeId;

  if (!storeId) {
    return res.status(400).json({ message: 'Store ID is required' });
  }

  req.tenantDb = getTenantDb(storeId);
  req.tenantId = storeId;
  next();
};

module.exports = tenantResolver;