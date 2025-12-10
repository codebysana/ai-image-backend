// models/User.js  (UPDATED)
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String, // hashed
    role: { type: String, default: "user" }, // 'user' or 'admin'
    credits: { type: Number, default: 5 }, // start credits
    isBanned: { type: Boolean, default: false },
    refreshTokens: [
      { token: String, createdAt: { type: Date, default: Date.now } },
    ], // store refresh tokens
    subscription: {
      plan: {
        type: String,
        enum: ["free", "monthly", "yearly"],
        default: "free",
      },
      active: { type: Boolean, default: false },
      startedAt: Date,
      expiresAt: Date,
    },
    avatarUrl: String,
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
    galleryOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
