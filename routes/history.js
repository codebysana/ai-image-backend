const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Image = require("../models/imageModel");

// GET /api/history
router.get("/", auth, async (req, res) => {
  try {
    const images = await Image.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(images.map(img => ({
      id: img._id,
      prompt: img.prompt,
      dataUrl: img.dataUrl,
      createdAt: img.createdAt,
    })));
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ message: "Failed to load history" });
  }
});

module.exports = router;
