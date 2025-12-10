// api/server.js - Vercel/serverless wrapper
require('dotenv').config();
const serverless = require('serverless-http');
const { app, connectToDatabase } = require('../app');

// Attempt DB connection on cold start to reduce latency on first request
connectToDatabase().catch((err) => console.error('DB connect failed', err));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

module.exports = serverless(app);

