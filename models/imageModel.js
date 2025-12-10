// models/Image.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    prompt: String,
    dataUrl: String, // store as data:image/png;base64,... (for simplicity)
    hfModel: String,
    createdAt: { type: Date, default: Date.now },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", ImageSchema);
