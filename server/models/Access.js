const mongoose = require('mongoose');

const accessSchema = new mongoose.Schema({
  companyId: { type: String, required: true },
  userId:    { type: String, required: true },
  userType:  { type: String, enum: ['super_admin', 'store_admin'], required: true },
  userName:  { type: String, required: true },
  status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true, collection: 'accesses' });

module.exports = mongoose.model('Access', accessSchema);