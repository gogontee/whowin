// components/MessagePortal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Phone, User, Calendar, MessageCircle, 
  CheckCircle, XCircle, RefreshCw, Search,
  ChevronLeft, ChevronRight, Eye, Check, Trash2,
  AlertCircle, Clock, Inbox, Star, Filter,
  ArrowLeft, Download, Printer, Archive
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export default function MessagePortal() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0
  });

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, []);

  // Update stats whenever messages change
  useEffect(() => {
    calculateStats();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('get_in_touch')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = messages.length;
    const unread = messages.filter(m => m.status === 'unread').length;
    const read = messages.filter(m => m.status === 'read').length;
    const replied = messages.filter(m => m.status === 'replied').length;
    setStats({ total, unread, read, replied });
  };

  // Mark message as read
  const markAsRead = async (message) => {
    if (message.status === 'read' || message.status === 'replied') return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('get_in_touch')
        .update({ 
          status: 'read', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', message.id);

      if (error) throw error;

      // Update local state
      setMessages(messages.map(msg => 
        msg.id === message.id ? { ...msg, status: 'read' } : msg
      ));

      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, status: 'read' });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update message status
  const updateMessageStatus = async (id, status) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('get_in_touch')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, status } : msg
      ));

      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete message
  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('get_in_touch')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessages(messages.filter(msg => msg.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle message selection
  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    // Mark as read when selected
    if (message.status === 'unread') {
      markAsRead(message);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.phone && msg.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'unread': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'read': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'replied': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-white/20 text-white/60';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'unread': return <Clock className="w-3 h-3" />;
      case 'read': return <Eye className="w-3 h-3" />;
      case 'replied': return <CheckCircle className="w-3 h-3" />;
      default: return <MessageCircle className="w-3 h-3" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      unread: 'bg-yellow-500/20 text-yellow-400',
      read: 'bg-blue-500/20 text-blue-400',
      replied: 'bg-green-500/20 text-green-400'
    };
    return colors[status] || 'bg-white/20 text-white/60';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white/60">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-400" />
            Message Portal
          </h2>
          <button
            onClick={fetchMessages}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-white/40 text-xs mb-1">Total Messages</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
            <p className="text-yellow-400/60 text-xs mb-1">Unread</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.unread}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <p className="text-blue-400/60 text-xs mb-1">Read</p>
            <p className="text-2xl font-bold text-blue-400">{stats.read}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <p className="text-green-400/60 text-xs mb-1">Replied</p>
            <p className="text-2xl font-bold text-green-400">{stats.replied}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone or message..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-orange-500 focus:outline-none transition"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-500 focus:outline-none transition"
        >
          <option value="all">All Messages</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
          <option value="replied">Replied Only</option>
        </select>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {paginatedMessages.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
              <Inbox className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No messages found</p>
            </div>
          ) : (
            paginatedMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 rounded-lg p-4 border cursor-pointer transition-all ${
                  selectedMessage?.id === msg.id
                    ? 'border-orange-500 ring-1 ring-orange-500/50'
                    : msg.status === 'unread'
                    ? 'border-yellow-500/30 hover:border-yellow-500/50'
                    : 'border-white/10 hover:border-orange-500/30'
                }`}
                onClick={() => handleSelectMessage(msg)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{msg.full_name}</h3>
                      {msg.status === 'unread' && (
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-medium">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{msg.email}</span>
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${getStatusColor(msg.status)}`}>
                    {getStatusIcon(msg.status)}
                    {msg.status}
                  </span>
                </div>
                <p className="text-xs text-white/40 line-clamp-2 mt-2">{msg.message}</p>
                <p className="text-[10px] text-white/30 mt-2">
                  {format(new Date(msg.created_at), 'MMM d, yyyy · h:mm a')}
                </p>
              </motion.div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <p className="text-xs text-white/40">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Details */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Message Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-yellow-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {selectedMessage.full_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-white/60 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedMessage.email}
                      </span>
                      {selectedMessage.phone && (
                        <span className="text-white/60 flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {selectedMessage.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadge(selectedMessage.status)}`}>
                    {getStatusIcon(selectedMessage.status)}
                    {selectedMessage.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar className="w-3 h-3" />
                  <span>Received: {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy · h:mm:ss a')}</span>
                </div>
                {selectedMessage.updated_at !== selectedMessage.created_at && (
                  <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {format(new Date(selectedMessage.updated_at), 'MMM d, yyyy · h:mm a')}</span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="p-6">
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-orange-400" />
                    Message:
                  </h3>
                  <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Actions:</h3>
                  
                  {/* Status Update */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/60">Mark as:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, 'unread')}
                        disabled={updating || selectedMessage.status === 'unread'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedMessage.status === 'unread'
                            ? 'bg-yellow-500/20 text-yellow-400 cursor-default'
                            : 'bg-white/5 text-white/60 hover:bg-yellow-500/20 hover:text-yellow-400'
                        }`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />
                        Unread
                      </button>
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                        disabled={updating || selectedMessage.status === 'read'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedMessage.status === 'read'
                            ? 'bg-blue-500/20 text-blue-400 cursor-default'
                            : 'bg-white/5 text-white/60 hover:bg-blue-500/20 hover:text-blue-400'
                        }`}
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        Read
                      </button>
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                        disabled={updating || selectedMessage.status === 'replied'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedMessage.status === 'replied'
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : 'bg-white/5 text-white/60 hover:bg-green-500/20 hover:text-green-400'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Replied
                      </button>
                    </div>
                  </div>

                  {/* Quick Reply */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: Celebrity Star Africa Contact&body=Dear ${selectedMessage.full_name},%0D%0A%0D%0A`}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Mail className="w-4 h-4" />
                      Reply via Email
                    </a>
                    {selectedMessage.phone && (
                      <>
                        <a
                          href={`tel:${selectedMessage.phone}`}
                          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${selectedMessage.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      disabled={updating}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Message
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 rounded-xl p-12 border border-white/10 flex flex-col items-center justify-center text-center h-[500px]">
              <MessageCircle className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Message Selected</h3>
              <p className="text-white/40 text-sm max-w-sm">
                Select a message from the list to view its details and take action.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Updating Indicator */}
      <AnimatePresence>
        {updating && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}