// components/admin/GiftTransactions.js
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  Download,
  Loader,
  Award,
  CreditCard,
  Hash,
  Filter,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Gift,
  Zap,
  ChevronDown,
  ChevronUp,
  Heart,
  Crown,
  Star,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

// Gift emoji mapping
const GIFT_EMOJIS = {
  'flower': '🌹',
  'blow_kisses': '😘',
  'silver_ring': '💍',
  'love': '❤️',
  'heart': '💖',
  'golden_ring': '💛',
  'trophy': '🏆',
  'crown': '👑',
  'dragon': '🐉',
  'rose': '🌹',
  'kiss': '😘',
  'ring': '💍'
};

const GIFT_COLORS = {
  'flower': 'from-pink-400 to-rose-500',
  'blow_kisses': 'from-red-400 to-pink-500',
  'silver_ring': 'from-gray-300 to-gray-400',
  'love': 'from-red-500 to-red-600',
  'heart': 'from-rose-400 to-pink-500',
  'golden_ring': 'from-yellow-400 to-amber-500',
  'trophy': 'from-amber-400 to-yellow-500',
  'crown': 'from-yellow-400 to-amber-500',
  'dragon': 'from-emerald-400 to-green-500',
  'rose': 'from-pink-400 to-rose-500',
  'kiss': 'from-red-400 to-pink-500',
  'ring': 'from-yellow-400 to-amber-500'
};

export default function GiftTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sendersMap, setSendersMap] = useState({});
  const [recipientsMap, setRecipientsMap] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [giftTypeFilter, setGiftTypeFilter] = useState('');
  const [showStats, setShowStats] = useState(true);
  
  // Show gifters toggle
  const [showGifters, setShowGifters] = useState(true);
  const [isTogglingGifters, setIsTogglingGifters] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingToggleState, setPendingToggleState] = useState(null);

  const ITEMS_PER_PAGE = 10;
  const tableRef = useRef(null);
  const statsRef = useRef(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchTransactions();
    fetchGifterSettings();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, searchType, transactions, dateFilter, minAmount, maxAmount, giftTypeFilter]);

  const fetchGifterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('show_gifters')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setShowGifters(data.show_gifters === true);
      }
    } catch (error) {
      console.error('Error fetching gifter settings:', error);
    }
  };

  const toggleShowGifters = async (newState) => {
    setIsTogglingGifters(true);
    try {
      const { data: existing, error: checkError } = await supabase
        .from('who_win')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existing) {
        result = await supabase
          .from('who_win')
          .update({ show_gifters: newState })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('who_win')
          .insert({ show_gifters: newState });
      }

      if (result.error) throw result.error;

      setShowGifters(newState);
      setShowConfirmModal(false);
      setPendingToggleState(null);

    } catch (error) {
      console.error('Error toggling gifter visibility:', error);
      alert('Failed to update gifter visibility settings. Please try again.');
    } finally {
      setIsTogglingGifters(false);
    }
  };

  const handleGifterToggle = (newState) => {
    setPendingToggleState(newState);
    setShowConfirmModal(true);
  };

  const confirmToggle = () => {
    if (pendingToggleState !== null) {
      toggleShowGifters(pendingToggleState);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('gift_transactions')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .range(from, to);

      if (error) throw error;

      setTransactions(data || []);
      setTotalCount(count || 0);

      if (data && data.length > 0) {
        const senderIds = data
          .filter(tx => tx.user_id)
          .map(tx => tx.user_id);

        const recipientIds = data
          .filter(tx => tx.candidate_id)
          .map(tx => tx.candidate_id);

        const allProfileIds = [...new Set([...senderIds, ...recipientIds])];

        if (allProfileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', allProfileIds);

          if (profiles) {
            const map = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
            
            setSendersMap(map);
            setRecipientsMap(map);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gift transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => {
        const senderName = getSenderName(tx).toLowerCase();
        const recipientName = getRecipientName(tx).toLowerCase();
        const recipientUsername = getRecipientUsername(tx)?.toLowerCase() || '';
        const email = getSenderEmail(tx)?.toLowerCase() || '';
        const ref = tx.reference?.toLowerCase() || '';
        const giftName = tx.gift_name?.toLowerCase() || '';

        switch (searchType) {
          case 'sender':
            return senderName.includes(term);
          case 'recipient':
            return recipientName.includes(term) || recipientUsername.includes(term);
          case 'email':
            return email.includes(term);
          case 'reference':
            return ref.includes(term);
          case 'gift':
            return giftName.includes(term);
          default:
            return senderName.includes(term) ||
                   recipientName.includes(term) ||
                   recipientUsername.includes(term) ||
                   email.includes(term) ||
                   ref.includes(term) ||
                   giftName.includes(term);
        }
      });
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate.toDateString() === filterDate.toDateString();
      });
    }

    if (minAmount) {
      filtered = filtered.filter(tx => (tx.amount || 0) >= parseInt(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(tx => (tx.amount || 0) <= parseInt(maxAmount));
    }
    if (giftTypeFilter) {
      filtered = filtered.filter(tx => tx.gift_type === giftTypeFilter);
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchType('all');
    setDateFilter('');
    setMinAmount('');
    setMaxAmount('');
    setGiftTypeFilter('');
    setIsFilterOpen(false);
  };

  const getSenderName = (transaction) => {
    if (transaction.guest_name) {
      return transaction.guest_name;
    } else if (transaction.user_id && sendersMap[transaction.user_id]) {
      return sendersMap[transaction.user_id].full_name || sendersMap[transaction.user_id].username;
    } else if (transaction.guest_email) {
      return transaction.guest_email.split('@')[0];
    }
    return 'Anonymous Sender';
  };

  const getSenderEmail = (transaction) => {
    if (transaction.guest_email) {
      return transaction.guest_email;
    } else if (transaction.user_id && sendersMap[transaction.user_id]) {
      return 'Registered User';
    }
    return null;
  };

  const getRecipientName = (transaction) => {
    if (transaction.candidate_id && recipientsMap[transaction.candidate_id]) {
      return recipientsMap[transaction.candidate_id].full_name || recipientsMap[transaction.candidate_id].username;
    }
    return 'Unknown Recipient';
  };

  const getRecipientUsername = (transaction) => {
    if (transaction.candidate_id && recipientsMap[transaction.candidate_id]) {
      return recipientsMap[transaction.candidate_id].username;
    }
    return null;
  };

  const getGiftEmoji = (transaction) => {
    return GIFT_EMOJIS[transaction.gift_type] || '🎁';
  };

  const getGiftColor = (transaction) => {
    return GIFT_COLORS[transaction.gift_type] || 'from-purple-500 to-pink-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const headers = ['Sender Name', 'Email', 'Recipient', 'Username', 'Gift', 'Amount (NGN)', 'Reference', 'Date'];
    
    const csvData = dataToExport.map(t => [
      getSenderName(t),
      getSenderEmail(t) || 'N/A',
      getRecipientName(t),
      getRecipientUsername(t) || 'N/A',
      `${getGiftEmoji(t)} ${t.gift_name || 'Gift'}`,
      t.amount || 0,
      t.reference || 'N/A',
      formatDate(t.created_at)
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gift_transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStats = (data) => {
    const totalGifts = data.length;
    const totalAmount = data.reduce((sum, t) => sum + (t.amount || 0), 0);
    const uniqueSenders = new Set(data.map(t => t.user_id || t.guest_email).filter(Boolean)).size;
    const topGift = data.reduce((max, t) => (t.amount || 0) > (max.amount || 0) ? t : max, { amount: 0 });
    return { totalGifts, totalAmount, uniqueSenders, topGift };
  };

  const displayData = filteredTransactions.length > 0 ? filteredTransactions : transactions;
  const stats = getStats(displayData);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const searchOptions = [
    { value: 'all', label: 'All Fields' },
    { value: 'sender', label: 'Sender Name' },
    { value: 'recipient', label: 'Recipient Name' },
    { value: 'email', label: 'Email' },
    { value: 'reference', label: 'Reference' },
    { value: 'gift', label: 'Gift Type' },
  ];

  const giftTypeOptions = [
    { value: '', label: 'All Gifts' },
    { value: 'flower', label: '🌹 Flower' },
    { value: 'blow_kisses', label: '😘 Blow Kisses' },
    { value: 'silver_ring', label: '💍 Silver Ring' },
    { value: 'love', label: '❤️ Love' },
    { value: 'heart', label: '💖 Heart' },
    { value: 'golden_ring', label: '💛 Golden Ring' },
    { value: 'trophy', label: '🏆 Trophy' },
    { value: 'crown', label: '👑 Crown' },
    { value: 'dragon', label: '🐉 Dragon' },
  ];

  return (
    <div className="relative">
      {/* ===== FLOATING STATS BAR ===== */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            ref={statsRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 py-3 px-4 mb-4 rounded-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg">
                    <Gift className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Total Gifts</div>
                    <div className="text-lg font-bold text-pink-400">{stats.totalGifts.toLocaleString()}</div>
                  </div>
                </div>

                <div className="w-px h-10 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Unique Senders</div>
                    <div className="text-lg font-bold text-green-400">{stats.uniqueSenders.toLocaleString()}</div>
                  </div>
                </div>

                <div className="w-px h-10 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Total Amount</div>
                    <div className="text-lg font-bold text-yellow-400">₦{stats.totalAmount.toLocaleString()}</div>
                  </div>
                </div>

                {stats.topGift?.amount > 0 && (
                  <>
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Top Gift</div>
                        <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
                          <span>{getGiftEmoji(stats.topGift)}</span>
                          <span>₦{stats.topGift.amount?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Show Gifters Toggle */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                  <button
                    onClick={() => handleGifterToggle(!showGifters)}
                    disabled={isTogglingGifters}
                    className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showGifters ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-green-400" />
                        <span>Showing Gifters</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-red-400" />
                        <span>Gifters Hidden</span>
                      </>
                    )}
                    {isTogglingGifters && <Loader className="w-3 h-3 animate-spin ml-1" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className="text-[10px] text-white/30">
                  {displayData.length} of {totalCount} gifts
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Search className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Search senders, recipients, emails, references, gifts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-pink-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-pink-500 focus:outline-none transition-colors appearance-none min-w-[120px]"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
            >
              {searchOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl transition-all ${
                isFilterOpen || dateFilter || minAmount || maxAmount || giftTypeFilter
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={exportToCSV}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Min Amount (NGN)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Max Amount (NGN)</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Gift Type</label>
                  <select
                    value={giftTypeFilter}
                    onChange={(e) => setGiftTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-pink-500 focus:outline-none transition-colors appearance-none"
                  >
                    {giftTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sm:hidden mt-3">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===== TRANSACTIONS TABLE ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {displayData.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <div className="text-4xl mb-3">🎁</div>
                <p className="text-sm">No gift transactions found</p>
              </div>
            ) : (
              displayData.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGiftColor(transaction)} flex items-center justify-center flex-shrink-0 text-2xl`}>
                      {getGiftEmoji(transaction)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">
                        {getSenderName(transaction)}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/60">→</span>
                        <span className="text-white/80 truncate">{getRecipientName(transaction)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-400">₦{transaction.amount?.toLocaleString() || 0}</div>
                      <div className="text-xs text-white/40">{transaction.gift_name || 'Gift'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/40">
                      <span className="font-mono">{transaction.reference?.substring(0, 10)}...</span>
                    </div>
                    <div className="text-white/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(transaction.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Sender</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Recipient</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Username</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Gift</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Amount</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Reference</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-white/40">
                        <div className="text-4xl mb-3">🎁</div>
                        <p className="text-sm">No gift transactions match your filters</p>
                      </td>
                    </tr>
                  ) : (
                    displayData.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGiftColor(transaction)} flex items-center justify-center flex-shrink-0 text-sm`}>
                              {getGiftEmoji(transaction)}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {getSenderName(transaction)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {getSenderEmail(transaction) ? (
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{getSenderEmail(transaction)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-white/30">No email</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-pink-400 flex-shrink-0" />
                            <span className="text-sm text-white/80 font-medium">
                              {getRecipientName(transaction)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-white/40 font-mono">
                            @{getRecipientUsername(transaction) || 'unknown'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getGiftEmoji(transaction)}</span>
                            <span className="text-sm text-white/80">{transaction.gift_name || 'Gift'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-semibold text-yellow-400">
                            ₦{transaction.amount?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                            {transaction.reference?.substring(0, 12)}...
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
              <p className="text-xs text-white/30 order-2 sm:order-1">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} gifts
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                            : 'text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== CONFIRMATION MODAL - Clean & Compact ===== */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowConfirmModal(false);
              setPendingToggleState(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-5 max-w-sm w-full shadow-2xl shadow-yellow-400/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-yellow-400/15 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  {pendingToggleState ? 'Show Gifters?' : 'Hide Gifters?'}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {pendingToggleState 
                    ? 'Allow housemates to see who is sending gifts?'
                    : 'Hide gifters from housemates?'
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingToggleState(null);
                  }}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={isTogglingGifters}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {isTogglingGifters ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {pendingToggleState ? 'Yes, Show' : 'Yes, Hide'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}