// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/static', express.static('public'));

// Routes
const user = require('./routes/user.js');
const generate = require('./routes/generate');
const history = require('./routes/history');
const report = require('./routes/report');
const admin = require('./routes/admin');
const generateMock = require('./routes/generateMock');
const subscriptionMock = require('./routes/subscriptionMock');
const gallery = require('./routes/gallery');
const shareImage = require('./routes/shareImage');
const paymentRoutes = require('./routes/payment');
const testHF = require('./routes/testHF');

app.use('/api/test-hf', testHF);
app.use('/api/user', user);
app.use('/api/generate', generate);
app.use('/api/history', history);
app.use('/api/report', report);
app.use('/api/admin', admin);
app.use('/api/generate-mock', generateMock);
app.use('/api/subscription/mock', subscriptionMock);
app.use('/api/gallery', gallery);
app.use('/api/share', shareImage);
app.use('/api/payments', paymentRoutes);

// Health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Fast response for favicon requests (prevents slow 404 handling in serverless)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root quick health check
app.get('/', (req, res) => res.send('AI Image Backend')); 

// Database helper for reuse across serverless invocations
const MONGO_URI = process.env.MONGO_URI;
async function connectToDatabase() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI is not set; skipping DB connection');
    return;
  }
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log('Mongo connected');
  } catch (err) {
    console.error('DB connect error', err && err.message ? err.message : err);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack || err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = { app, connectToDatabase };

