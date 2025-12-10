// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const user = require("./routes/user.js");
const generate = require("./routes/generate");
const history = require("./routes/history");
const report = require("./routes/report");
const admin = require("./routes/admin");
const generateMock = require("./routes/generateMock");
const subscriptionMock = require("./routes/subscriptionMock");
const gallery = require("./routes/gallery");
const shareImage = require("./routes/shareImage");
const paymentRoutes = require("./routes/payment");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" })); // allow large images
app.use("/static", express.static("public"));

const testHF = require("./routes/testHF");
app.use("/api/test-hf", testHF);

// Routes
app.use("/api/user", user);
app.use("/api/generate", generate);
app.use("/api/history", history);
app.use("/api/report", report);
app.use("/api/admin", admin);
app.use("/api/generate-mock", generateMock);
app.use("/api/subscription/mock", subscriptionMock);
app.use("/api/gallery", gallery);
app.use("/api/share", shareImage);
app.use("/api/payments", paymentRoutes);

// Health
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// Connect DB and start
const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongo connected");
    app.listen(PORT, () => console.log("Server running on", PORT));
  })
  .catch((err) => {
    console.error("DB connect error", err);
  });

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});
