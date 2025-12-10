// routes/report.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Report = require("../models/reportModel");
const Image = require("../models/imageModel");

router.post("/", auth, async (req, res) => {
  try {
    const { imageId, reason } = req.body;
    if (!imageId) return res.status(400).json({ message: "imageId required" });

    const image = await Image.findById(imageId);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Save report
    const report = new Report({
      image: image._id,
      reporter: req.user._id,
      reason: reason || "No reason provided",
    });
    await report.save();

    // Optionally mark image as flagged so admin can see it
    image.flagged = true;
    await image.save();

    res.json({ message: "Report submitted" });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ message: "Failed to submit report" });
  }
});

module.exports = router;
