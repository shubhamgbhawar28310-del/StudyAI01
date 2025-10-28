const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Upload and analyze document
router.post('/upload', documentController.uploadDocument);

// Analyze text directly
router.post('/analyze-text', documentController.analyzeText);

// Generate study materials
router.post('/generate-materials', documentController.generateMaterials);

module.exports = router;