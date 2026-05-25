import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { ArrowLeft, Send, User, MoreVertical } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  text: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    online: boolean;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Chat = ({ user, token }: { user: any; token: string }) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherParticipant = conversation?.participants.find(p => p._id !== user.id);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, messagesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/chat/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/chat/messages/${conversationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const conversation = convRes.data.find((c: Conversation) => c._id === conversationId);
        setConversation(conversation);
        setMessages(messagesRes.data);
        
        // Mark messages as read
        await axios.put(`http://localhost:5000/api/chat/messages/read/${conversationId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [conversationId, token]);

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.emit('join', user.id);
    
    // ✅ Join conversation room for typing indicators
    if (conversationId) {
      newSocket.emit('join_conversation', conversationId);
    }
    
    newSocket.on('receive_message', (message: Message) => {
      // ✅ Prevent duplicate messages (if temp message already exists)
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });
    
    newSocket.on('typing_start', (data: { userId: string; userName: string }) => {
      if (data.userId === otherParticipant?._id) {
        setOtherUserTyping(true);
      }
    });
    
    newSocket.on('typing_stop', (data: { userId: string }) => {
      if (data.userId === otherParticipant?._id) {
        setOtherUserTyping(false);
      }
    });
    
    return () => {
      newSocket.close();
    };
  }, [user.id, otherParticipant?._id, conversationId]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping && socket && conversationId) {
      setIsTyping(true);
      socket.emit('typing_start', {
        conversationId,
        userId: user.id,
        userName: user.name
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && conversationId) {
        setIsTyping(false);
        socket.emit('typing_stop', {
          conversationId,
          userId: user.id
        });
      }
    }, 1000);
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !conversationId) return;
    
    const messageData = {
      conversationId,
      senderId: user.id,
      text: newMessage
    };
    
    // Create temporary message for UI
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`, // temporary ID with prefix
      sender: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      text: newMessage,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    socket.emit('send_message', messageData);
    setNewMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing_stop', {
      conversationId,
      userId: user.id
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inbox')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {otherParticipant?.name.charAt(0).toUpperCase()}
              </div>
              {otherParticipant?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{otherParticipant?.name}</h2>
              <p className="text-xs text-gray-500">
                {otherParticipant?.online ? 'Online' : 'Offline'} • {otherParticipant?.role}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.sender._id === user.id;
          return (
            <div
              key={message._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                {!isOwn && (
                  <p className="text-xs text-gray-500 mb-1 ml-2">{message.sender.name}</p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {isOwn && message.read && (
                      <span className="ml-2 text-green-200">✓✓ Read</span>
                    )}
                  </p>
                </div>
              </div>
              {!isOwn && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold ml-2 order-2">
                  {message.sender.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;