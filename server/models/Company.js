const mongoose = require('mongoose');

// Slugify companyName to create companyId
// "Hari Electronics" → "hari_electronics"
const slugify = (name) =>
  name.toLowerCase().trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const companySchema = new mongoose.Schema({
  companyId:   { type: String, unique: true }, // slugified companyName
  companyName: { type: String, required: true },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true, collection: 'companies' });

// Auto-generate companyId from companyName before saving
companySchema.pre('save', async function () {
  if (!this.companyId) {
    const baseId = slugify(this.companyName);
    
    // Make companyId unique by appending number if already taken
    let companyId = baseId;
    let counter = 1;
    while (await mongoose.model('Company').findOne({ companyId })) {
      companyId = `${baseId}_${counter}`;
      counter++;
    }
    this.companyId = companyId;
  }
});

module.exports = mongoose.model('Company', companySchema);