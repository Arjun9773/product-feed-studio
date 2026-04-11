const mongoose = require('mongoose');

const feedFormatSchema = new mongoose.Schema({
  feed_id:      { type: Number,  required: true, unique: true },
  feed_name:    { type: String,  required: true },  // "Google Shopping XML"
  alias_name:   { type: String,  default: '' },     // "Google Shopping"
  feed_format:  { type: String,  required: true },  // "xml" / "csv"
  feed_separator: { type: String, default: '' },
  feed_encoding:  { type: String, default: 'utf-8' },
  feed_folder:    { type: String, default: '' },    // "gb" → fileurl-ல use ஆகும்
  no_header:      { type: Number, default: 0 },
  status:         { type: String, enum: ['active', 'inactive'], default: 'active' },
  archived:       { type: Number, default: 0 },
  addedon:        { type: Date,   default: Date.now },
}, { timestamps: false, collection: 'feed_formats' });

module.exports = mongoose.model('FeedFormat', feedFormatSchema);
