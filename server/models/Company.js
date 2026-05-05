const mongoose = require("mongoose");

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const companySchema = new mongoose.Schema(
  {
    companyId: { type: String, unique: true },
    companyName: { type: String, required: true },
    companyUrl: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "companies" },
);

companySchema.pre("save", async function () {
  try {
    console.log("[Company.pre.save] Starting pre-save hook");
    if (!this.companyId) {
      const baseId = slugify(this.companyName);
      let companyId = baseId;
      let counter = 1;
      while (await mongoose.model("Company").findOne({ companyId })) {
        companyId = `${baseId}_${counter}`;
        counter++;
      }
      this.companyId = companyId;
      console.log("[Company.pre.save] ✓ Generated companyId:", companyId);
    }
  } catch (err) {
    console.error("[Company.pre.save] Error:", err);
    throw err;
  }
});

module.exports = mongoose.model("Company", companySchema);
