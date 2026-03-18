const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateUserId = () => `usr_${crypto.randomBytes(8).toString('hex')}`;

const userSchema = new mongoose.Schema({
  userId:    { type: String, unique: true, default: generateUserId },
  companyId: { type: String, required: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  phone:     { type: String, default: '' },
  userType:  { type: String, enum: ['super_admin', 'store_admin'], default: 'store_admin' },
}, { timestamps: true, collection: 'users' });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);