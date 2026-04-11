const mongoose = require('mongoose');
const FeedFormat = require('./models/FeedFormat');
require('dotenv').config();

const formats = [
  {
    feed_id:     1,
    feed_name:   "Google Shopping XML",
    alias_name:  "Google Shopping",
    feed_format: "xml",
    feed_folder: "gb",
    feed_encoding: "utf-8",
    status:      "active",
    archived:    0,
  },
  {
    feed_id:     5,
    feed_name:   "Google Shopping CSV",
    alias_name:  "Google Shopping",
    feed_format: "csv",
    feed_folder: "gb_csv",
    feed_encoding: "utf-8",
    no_header:   0,
    status:      "active",
    archived:    0,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await FeedFormat.deleteMany({});
  await FeedFormat.insertMany(formats);
  console.log('Feed formats seeded!');
  process.exit(0);
}

seed();
