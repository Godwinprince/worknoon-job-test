import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    online: boolean;
  }>;
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const Inbox = ({ user, token }: { user: any; token: string }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data.filter((u: User) => u._id !== user.id));
      setShowUserList(true);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const startConversation = async (otherUserId: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/chat/conversation/start', 
        { otherUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowUserList(false);
      navigate(`/chat/${response.data._id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">Chat Inbox</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Profile"
            >
              <UserIcon className="w-5 h-5 text-gray-600" />
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Admin Dashboard"
              >
                <Shield className="w-5 h-5 text-purple-600" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* New Chat Button */}
        <button
          onClick={fetchUsers}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Start New Conversation
        </button>

        {/* User List Modal */}
        {showUserList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-96 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Select a user to chat with</h2>
                <button
                  onClick={() => setShowUserList(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto max-h-80">
                {allUsers.map((otherUser) => (
                  <button
                    key={otherUser._id}
                    onClick={() => {startConversation(otherUser._id)}}
                    className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 text-left transition"
                  >
                    <p className="font-medium text-gray-800">{otherUser.name}</p>
                    <p className="text-sm text-gray-500">{otherUser.email}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                      {otherUser.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Start New Conversation" to begin chatting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              if (!other) return null;
              
              return (
                <div
                  key={conversation._id}
                  onClick={() => navigate(`/chat/${conversation._id}`)}
                  className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Online Indicator */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {other.name.charAt(0).toUpperCase()}
                        </div>
                        {other.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{other.name}</h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {other.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {conversation.lastMessageTime && formatTime(conversation.lastMessageTime)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;