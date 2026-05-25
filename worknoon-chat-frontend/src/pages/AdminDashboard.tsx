import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Trash2, RefreshCw, Shield } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  online: boolean;
  createdAt: string;
}

interface Message {
  _id: string;
  text: string;
  sender: { name: string; email: string };
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{ name: string; email: string; role: string }>;
  lastMessage: string;
  lastMessageTime: string;
}

const AdminDashboard = ({ token }: { token: string }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'conversations'>('users');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('User deleted successfully');
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Failed to delete user');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Message deleted successfully');
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting message:', error);
      setMessage('Failed to delete message');
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      agent: 'bg-green-100 text-green-700',
      customer: 'bg-blue-100 text-blue-700',
      designer: 'bg-pink-100 text-pink-700',
      merchant: 'bg-orange-100 text-orange-700'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
          </div>
          <button
            onClick={() => { fetchUsers(); fetchConversations(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-lg">
            {message}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'conversations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-1" />
            Conversations ({conversations.length})
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Email</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Role</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Joined</th>
                    <th className="text-left p-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{user.name}</td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-sm ${user.online ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {user.online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversations List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">All Conversations</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => fetchMessages(conv._id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedConversation === conv._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-800">
                      {conv.participants.map(p => p.name).join(' vs ')}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(conv.lastMessageTime).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-800">Messages</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {selectedConversation ? (
                  messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg._id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">{msg.sender.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{msg.text}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteMessage(msg._id)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete Message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400">No messages in this conversation</div>
                  )
                ) : (
                  <div className="p-8 text-center text-gray-400">Select a conversation to view messages</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;