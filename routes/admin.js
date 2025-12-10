// routes/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const User = require("../models/userModel");

// Toggle ban/unban a user
router.patch("/users/:id/ban", auth, role("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ id: user._id, isBanned: user.isBanned });
  } catch (err) {
    console.error("Admin ban error:", err);
    res.status(500).json({ message: "Failed to toggle ban" });
  }
});

// Simple list users (for admin panel)
router.get("/users", auth, role("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
