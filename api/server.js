require('dotenv').config();
const serverless = require('serverless-http');
const { app, connectToDatabase } = require('../app');

const handler = serverless(app);

// Connect to DB asynchronously, do not block root route
connectToDatabase().catch(err => console.error('DB connect failed:', err));

module.exports = handler;
