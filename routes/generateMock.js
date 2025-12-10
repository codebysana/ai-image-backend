// routes/generateMock.js (UPDATED to use local static image)
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Image = require("../models/imageModel");

// Use locally served static mock image
const PLACEHOLDER_URL = "http://localhost:4000/static/mock-03.jpg";

router.post("/", auth, async (req, res) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt required" });

    const img = new Image({
      user: req.user._id,
      prompt,
      dataUrl: PLACEHOLDER_URL,
      hfModel: "mock",
    });
    await img.save();

    res.json({
      image: {
        id: img._id,
        url: img.dataUrl,
        prompt: img.prompt,
        createdAt: img.createdAt,
      },
    });
  } catch (err) {
    console.error("Mock generate error:", err);
    res.status(500).json({ message: "Mock generate failed" });
  }
});

module.exports = router;
