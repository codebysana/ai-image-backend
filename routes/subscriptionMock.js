// routes/subscriptionMock.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/userModel");

router.post("/", auth, async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'
    if (!["monthly", "yearly"].includes(plan))
      return res.status(400).json({ message: "Invalid plan" });

    // Mock success: set subscription on user (no payment processing)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + (plan === "monthly" ? 1 : 12));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscription: { plan, active: true, startedAt: now, expiresAt },
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "Subscription successful (mock)",
      subscription: user.subscription,
    });
  } catch (err) {
    console.error("Subscription mock error:", err);
    res.status(500).json({ message: "Subscription failed" });
  }
});

module.exports = router;
