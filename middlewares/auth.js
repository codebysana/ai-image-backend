// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function (req, res, next) {
  const auth = req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token)
    return res.status(401).json({ message: "No token, please login." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = user;
    if (user.isBanned) return res.status(403).json({ message: "User banned." });
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token invalid." });
  }
};
