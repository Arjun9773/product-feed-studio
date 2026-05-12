const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const generateUserId = () => `usr_${crypto.randomBytes(8).toString("hex")}`;

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, default: generateUserId },
    companyId: { type: String, required: true },
    companyUrl: { type: String, default: "" },
    companyName: { type: String, default: "" },
    userName: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    photoPath: { type: String, default: "" },
    userType: {
      type: String,
      enum: ["super_admin", "store_admin", "user"],
      default: "store_admin",
    },
    googleOAuthToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleOAuthToken",
    },
    googleConnectedAt: { type: Date },
  },
  { timestamps: true, collection: "users" },
);

userSchema.pre("save", async function (next) {
  try {
    console.log("[User.pre.save] Starting pre-save hook for:", this.email);
    if (!this.isModified("password")) {
      console.log("[User.pre.save] Password not modified, skipping hash");
      return;
    }
    console.log("[User.pre.save] Hashing password...");
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    console.log("[User.pre.save] ✓ Password hashed successfully");
  } catch (err) {
    console.error("[User.pre.save] Error:", err);
    throw err;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
