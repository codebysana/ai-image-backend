// routes/gallery.js
const express = require("express");
const router = express.Router();
const Image = require("../models/imageModel");
const User = require("../models/userModel");

// Public gallery (no auth)
router.get("/", async (req, res) => {
  try {
    // Join Image with user to filter by galleryOptIn
    const images = await Image.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      { $match: { "owner.galleryOptIn": true } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          prompt: 1,
          dataUrl: 1,
          createdAt: 1,
          "owner.name": 1,
          "owner.avatarUrl": 1,
        },
      },
    ]);
    res.json({ images });
  } catch (err) {
    console.error("Gallery error:", err);
    res.status(500).json({ message: "Failed to load gallery" });
  }
});

module.exports = router;
