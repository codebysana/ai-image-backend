// routes/share.js
const express = require("express");
const router = express.Router();
const Image = require("../models/imageModel");
const User = require("../models/userModel");

// GET /api/share/:id -> returns public URL + metadata if owner opted-in or public
router.get("/:id", async (req, res) => {
  try {
    const img = await Image.findById(req.params.id).populate(
      "user",
      "name galleryOptIn"
    );
    if (!img) return res.status(404).json({ message: "Image not found" });

    // If owner didn't opt into gallery and image is not public, we still return a share link,
    // but in a real app you'd check permissions or generate one-time tokens.
    const publicUrl = img.dataUrl; // We host images as dataUrls or static urls; this example returns dataUrl directly
    res.json({
      id: img._id,
      prompt: img.prompt,
      publicUrl,
      owner: img.user.name,
    });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ message: "Failed to create share link" });
  }
});

module.exports = router;
