const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const user = new User({ name, email, password, role });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (error) {

    logger.error({
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    });
     logger.error({
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    });
    next(error);

    //res.status(500).json({ message: 'Server error' });
    console.error('Signup error:', error); // Add this line
    res.status(500).json({ message: 'Server error', error: error.message });

  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
   // res.status(500).json({ message: 'Server error' });
    logger.error({
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    });
    next(error);

    console.error('Login error:', error); // Add this line
    res.status(500).json({ message: 'Server error', error: error.message });

  }
});

module.exports = router;