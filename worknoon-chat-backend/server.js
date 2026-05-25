// GLOBAL ERROR CATCHERS (MUST be at the very top to catch errors properlly)
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  // Don't crash - but log it
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.message : reason}`);
  if (reason instanceof Error && reason.stack) {
    logger.error(reason.stack);
  }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./config/logger');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const { sendNewMessageEmail } = require('./utils/email');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    logger.info('MongoDB connected');
  })
  .catch(err => {
    console.log(err);
    logger.error('MongoDB connection error:', err);
  });

// Test route
app.get('/', (req, res) => {
  res.send('Chat API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Socket.IO setup

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  let currentUserId = null;
  
  // Join user to their own room and set online status
  socket.on('join', async (userId) => {
    currentUserId = userId;
    socket.join(userId);
    
    // Update online status
    await User.findByIdAndUpdate(userId, { online: true });
    
    // Broadcast online status to all connected users
    socket.broadcast.emit('user_status', { userId, status: 'online' });
    
    logger.info(`User ${userId} joined their room and is now online`);
  });
  
  // Join conversation room for typing indicators
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    logger.info(`User ${currentUserId} joined conversation room: ${conversationId}`);
  });
  
  // Typing indicators (now works because user joined conversation room)
  socket.on('typing_start', (data) => {
    const { conversationId, userId, userName } = data;
    socket.to(conversationId).emit('typing_start', { userId, userName });
  });
  
  socket.on('typing_stop', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('typing_stop', { userId });
  });
  
  // Send message (your existing code)
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, text } = data;
      
      const message = new Message({
        conversation: conversationId,
        sender: senderId,
        text: text
      });
      await message.save();
      
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageTime: new Date()
      });
      
      const populatedMessage = await message.populate('sender', 'name email role');
      const conversation = await Conversation.findById(conversationId);
      const recipients = conversation.participants.filter(p => p.toString() !== senderId);
      
      recipients.forEach(recipient => {
        io.to(recipient.toString()).emit('receive_message', populatedMessage);
      });
      
      // ✅ Email notification for offline recipient
      const recipientId = recipients[0];
      const recipient = await User.findById(recipientId);
      if (recipient && !recipient.online) {
        const sender = await User.findById(senderId);
        await sendNewMessageEmail(recipient.email, sender.name, text);
        logger.info(`Email sent to offline user: ${recipient.email}`);
      }
      
    } catch (error) {
      logger.error('Send message error:', error);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    if (currentUserId) {
      await User.findByIdAndUpdate(currentUserId, { online: false });
      socket.broadcast.emit('user_status', { userId: currentUserId, status: 'offline' });
      logger.info(`User ${currentUserId} is now offline`);
    }
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/profile', require('./routes/profile'));

/*

{
  "_id": {
    "$oid": "6a11ce5c7c76af8c2201dea3"
  },
  "name": "Test User",
  "email": "testing@email.com",
  "password": "$2b$10$hYTLX8S5dq6iR7ugi5foL.t0gXr7nPUur130dB5chs7apsVFmQT0y",
  "role": "admin",
  "online": false,
  "createdAt": {
    "$date": "2026-05-23T15:57:16.658Z"
  },
  "updatedAt": {
    "$date": "2026-05-23T15:57:16.658Z"
  },
  "__v": 0
}

*/