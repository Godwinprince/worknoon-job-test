const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const router = express.Router();

// Get all conversations for logged in user
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId
    })
    .populate('participants', 'name email role online')
    .sort('-lastMessageTime');
    
    res.json(conversations);
  } catch (error) {
    logger.error({
      message: error.message,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
    });
    next(error);


    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', auth, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation.participants.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const messages = await Message.find({ 
      conversation: req.params.conversationId 
    }).populate('sender', 'name email role');
    
    res.json(messages);
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

// Create or get conversation between two users
router.post('/conversation/start', auth, async (req, res, next) => {
  try {
    const { otherUserId } = req.body;
    
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, otherUserId] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.userId, otherUserId]
      });
      await conversation.save();
    }
    
    res.json(conversation);
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

// Mark messages as read
router.put('/messages/read/:conversationId', auth, async (req, res, next) => {
  try {
    await Message.updateMany(
      { 
        conversation: req.params.conversationId,
        sender: { $ne: req.user.userId },
        read: false
      },
      { read: true }
    );
    
    res.json({ message: 'Messages marked as read' });
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

// Get all users except yourself (for starting conversations)
router.get('/users', auth, async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select('name email role online');
    res.json(users);
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

/*

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTExZTFkZTBmMTk3MDUxNzhiNDg3NGEiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3Nzk1NTY4MzB9.PFjjCxYLJdHn-aIZUY6jOaHPThKv02Bd4TGxIAET4ek",
  "user": {
    "id": "6a11e1de0f19705178b4874a",
    "name": "Test Godwin",
    "email": "charlesgodwin54@gmail.com",
    "role": "customer"
  }
}



*/