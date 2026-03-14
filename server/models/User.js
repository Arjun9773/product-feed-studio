const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateUserId = () => `usr_${crypto.randomBytes(8).toString('hex')}`;
// Example: usr_a1b2c3d4e5f6789a

const userSchema = new mongoose.Schema({
  user_id:  { type: String, unique: true, default: generateUserId },
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  shopName: { type: String, required: true },
  phone:    { type: String, default: '' },
  store_id: { type: String, unique: true, sparse: true }, // only for store_admin
  role:     { type: String, enum: ['super_admin', 'store_admin'], default: 'store_admin' },
}, { timestamps: true, collection: 'gmc_admin_users' });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('gmc_admin_users', userSchema);
