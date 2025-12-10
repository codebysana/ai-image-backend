// models/Report.js
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", ReportSchema);
