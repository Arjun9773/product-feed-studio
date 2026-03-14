const { getTenantDb } = require('../config/db');

const tenantResolver = (req, res, next) => {
  // Super admin can pass x-tenant-id to view any store
  // Store admin's store_id comes from their JWT
  const storeId = req.headers['x-tenant-id'] || req.user?.store_id;

  if (!storeId) {
    return res.status(400).json({ message: 'Store ID is required' });
  }

  req.tenantDb = getTenantDb(storeId);
  req.storeId = storeId;
  next();
};

module.exports = tenantResolver;
