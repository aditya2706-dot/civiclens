const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhook } = require('../controllers/whatsappController');

// Meta calls GET to verify the webhook endpoint
router.get('/webhook', verifyWebhook);

// Meta calls POST when a message is received
router.post('/webhook', handleWebhook);

module.exports = router;
