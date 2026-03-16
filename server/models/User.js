const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateUserId = () => `usr_${crypto.randomBytes(8).toString('hex')}`;

// Nested schema for feed configuration
const feedInfoSchema = new mongoose.Schema({
  feed_name:           { type: String, default: '' },
  feed_url:            { type: String, default: '' },
  feed_type:           { type: String, enum: ['json', 'shopify', 'wordpress'], default: 'json' },
  schedule_info:       { type: String, enum: ['Daily', 'Hourly', 'Weekly', 'Monthly'], default: 'Daily' },
  import_time:         { type: String, default: '06:00' },
  cms_upload_type:     { type: String, enum: ['none', 'shopify', 'wordpress'], default: 'none' },
  shopify_name:        { type: String, default: '' },
  shopify_accesstoken: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  user_id:   { type: String, unique: true, default: generateUserId },
  cmpid:     { type: String, unique: true, sparse: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  shopName:  { type: String, required: true },
  phone:     { type: String, default: '' },
  store_id:  { type: String, unique: true, sparse: true },
  role:      { type: String, enum: ['super_admin', 'store_admin'], default: 'store_admin' },
  feed_info: { type: feedInfoSchema, default: () => ({}) },
}, { timestamps: true, collection: 'gmc_admin_companies' });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);