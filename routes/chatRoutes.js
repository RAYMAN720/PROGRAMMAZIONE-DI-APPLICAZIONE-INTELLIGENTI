const express = require('express');
const { askMistral } = require('../services/mistralService');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ reply: 'Message is required.' });
    }

    const reply = await askMistral(message);
    res.json({ reply });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ reply: 'Server error.' });
  }
});

module.exports = router;