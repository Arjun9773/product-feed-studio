const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true, unique: true }, // "google-campaign"
    name:     { type: String, required: true },
    path:     { type: String, required: true },
    desc:     { type: String, default: "" },
    category: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "integrations" }
);

module.exports = mongoose.model("Integration", integrationSchema);
