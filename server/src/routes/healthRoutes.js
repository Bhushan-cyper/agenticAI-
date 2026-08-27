const express = require('express');
const mongoose = require('mongoose');
const env = require('../config/env');
const { getVectorStore } = require('../config/vectorStore');
const ragService = require('../services/ragService');

const router = express.Router();

router.get('/', async (req, res) => {
  let vectorHealth = { status: 'unknown' };
  try {
    const vs = getVectorStore();
    vectorHealth = await vs.healthCheck();
  } catch (err) {
    vectorHealth = { status: 'error', error: err.message };
  }

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    },
    services: {
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        type: env.MONGO_URI ? 'external-mongodb' : 'in-memory-mongodb-fallback',
      },
      vectorStore: vectorHealth,
      providers: env.getProvidersStatus(),
      ragPipeline: ragService.getPipelineStatus(),
    },
  });
});

module.exports = router;
