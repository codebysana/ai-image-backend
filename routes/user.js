// routes/auth.js (REPLACEMENT of previous version)
// NOTE: this replaces the earlier auth.js to include refresh tokens + logout + refresh endpoints
const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const ACCESS_EXPIRY = "15m"; // short-lived access token
const REFRESH_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

function createAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}
function createRefreshToken(payload) {
  // For refresh token we set long expiry and store it in DB
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${REFRESH_EXPIRY_SECONDS}s`,
  });
}

// register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "DB error on register" });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "DB error on login" });
  }
});

// refresh access token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    // Verify token
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      return res
        .status(401)
        .json({ message: "Refresh token invalid or expired" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    // Make sure refresh token exists in DB for this user
    const found = user.refreshTokens.find((rt) => rt.token === refreshToken);
    if (!found) {
      // Possible token reuse or logout -> reject
      return res.status(401).json({ message: "Refresh token not recognized" });
    }

    // Issue new access token (do not rotate refresh token to keep it simple).
    const newAccessToken = createAccessToken({ id: user._id });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ message: "Refresh failed" });
  }
});

// logout - revoke refresh token (client should send the refresh token)
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      // Even if invalid, respond ok to avoid token probing
      return res.json({ message: "Logged out" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.json({ message: "Logged out" });

    // Remove refresh token from DB
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken
    );
    await user.save();

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
});

// update user
// router.patch("/update", auth, async (req, res) => {
//   try {
//     const { name, email, avatarUrl, preferences, galleryOptIn } = req.body;
//     const updates = {};

//     if (name) updates.name = name;
//     if (email) updates.email = email;
//     if (avatarUrl) updates.avatarUrl = avatarUrl;
//     if (preferences) updates.preferences = { ...preferences };
//     if (typeof galleryOptIn === "boolean") updates.galleryOptIn = galleryOptIn;

//     const user = await User.findByIdAndUpdate(req.user._id, updates, {
//       new: true,
//     }).select("-password");
//     res.json({ user });
//   } catch (err) {
//     console.error("User update error:", err);
//     res.status(500).json({ message: "Failed to update profile" });
//   }
// });

router.put("/update", auth, async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true }
  ).select("-password");
  res.json(user);
});

router.put("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) return res.status(400).json({ message: "Wrong old password" });

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated" });
});

module.exports = router;
