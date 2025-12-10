// api/server.js - Vercel/serverless wrapper
require('dotenv').config();
const serverless = require('serverless-http');
const { app, connectToDatabase } = require('../app');

const handler = serverless(app);

// Wrap serverless handler with DB connection retry
module.exports = async (req, res) => {
  try {
    // Attempt DB connection for each request if not already connected
    await connectToDatabase();
  } catch (err) {
    console.error('Database connection failed:', err && err.message ? err.message : err);
    // Continue anyway — endpoints not requiring DB will still respond
  }

  // Call the serverless handler
  return handler(req, res);
};
