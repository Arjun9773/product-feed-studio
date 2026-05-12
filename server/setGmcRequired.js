// scripts/setGmcRequired.js
require('dotenv').config();
const mongoose = require('mongoose');

const GMC_FIELDS = [
  'title', 'description', 'price', 'image',
  'brand', 'condition', 'availability', 'product_url'
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection('feed_audit_issue');

  const r1 = await col.updateMany(
    { field: { $in: GMC_FIELDS } },
    { $set: { gmc_required: true } }
  );
  const r2 = await col.updateMany(
    { field: { $nin: GMC_FIELDS } },
    { $set: { gmc_required: false } }
  );

  console.log('GMC true:', r1.modifiedCount);
  console.log('GMC false:', r2.modifiedCount);
  await mongoose.disconnect();
}

run();
