const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');
const router = express.Router();



router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {

    logger.error({
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    });
    next(error);

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;