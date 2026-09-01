// app/[username]/myvoters/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ChevronLeft, 
  Users, 
  Mail, 
  Hash, 
  Calendar,
  Copy,
  Check,
  Search,
  Download,
  Gift,
  Vote,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

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
  'dragon': '🐉'
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
  'dragon': 'from-emerald-400 to-green-500'
};

export default function MyVotersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  
  // State
  const [allVotes, setAllVotes] = useState([]);
  const [allGifts, setAllGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all'); // 'all', 'votes', 'gifts'
  
  // Stats based on current filter
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalAmount: 0,
    uniqueVoters: 0,
    totalGifts: 0,
    totalGiftAmount: 0,
    uniqueGiftSenders: 0
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    checkUserAndFetchData();
  }, [username]);

  const checkUserAndFetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!profileData) {
        router.push('/404');
        return;
      }

      setProfile(profileData);
      setIsOwner(user?.id === profileData.id);

      if (user?.id !== profileData.id) {
        router.push(`/${username}`);
        return;
      }

      await fetchAllTransactions(profileData.id);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async (candidateId) => {
    try {
      // Fetch vote transactions
      const { data: voteData, error: voteError } = await supabase
        .from('vote_transactions')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (voteError) throw voteError;

      // Fetch gift transactions
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (giftError) throw giftError;

      // Get all user_ids from both transactions
      const userIds = [
        ...(voteData || []).filter(tx => tx.user_id).map(tx => tx.user_id),
        ...(giftData || []).filter(tx => tx.user_id).map(tx => tx.user_id)
      ];

      // Fetch profiles for registered users
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      // Enrich vote transactions
      const enrichedVotes = (voteData || []).map(tx => ({
        ...tx,
        type: 'vote',
        profile_data: tx.user_id ? profilesMap[tx.user_id] : null,
        display_name: tx.user_id && profilesMap[tx.user_id] 
          ? profilesMap[tx.user_id].full_name || `@${profilesMap[tx.user_id].username}`
          : tx.guest_name || tx.guest_email?.split('@')[0] || 'Anonymous Voter'
      }));

      // Enrich gift transactions
      const enrichedGifts = (giftData || []).map(tx => ({
        ...tx,
        type: 'gift',
        profile_data: tx.user_id ? profilesMap[tx.user_id] : null,
        display_name: tx.user_id && profilesMap[tx.user_id] 
          ? profilesMap[tx.user_id].full_name || `@${profilesMap[tx.user_id].username}`
          : tx.guest_name || tx.guest_email?.split('@')[0] || 'Anonymous Sender',
        gift_emoji: GIFT_EMOJIS[tx.gift_type] || '🎁',
        gift_color: GIFT_COLORS[tx.gift_type] || 'from-purple-500 to-pink-500',
        amount: tx.amount || 0
      }));

      setAllVotes(enrichedVotes);
      setAllGifts(enrichedGifts);
      
      // Calculate initial stats for 'all' filter
      calculateStats(enrichedVotes, enrichedGifts, 'all');

    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Calculate stats based on filter type
  const calculateStats = (votes, gifts, filter) => {
    const currentFilter = filter || filterType;
    
    let filteredVotes = votes || allVotes;
    let filteredGifts = gifts || allGifts;

    // Apply filter
    if (currentFilter === 'votes') {
      filteredGifts = [];
    } else if (currentFilter === 'gifts') {
      filteredVotes = [];
    }

    // Vote stats
    const totalVotes = filteredVotes.reduce((sum, tx) => sum + (tx.votes || 0), 0);
    const totalAmount = filteredVotes.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
    
    // Gift stats
    const totalGifts = filteredGifts.length;
    const totalGiftAmount = filteredGifts.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    // Unique voters/senders
    const allItems = [...filteredVotes, ...filteredGifts];
    const uniqueVoters = new Set(
      allItems
        .map(tx => tx.user_id || tx.guest_email)
        .filter(Boolean)
    ).size;

    setStats({
      totalVotes,
      totalAmount,
      uniqueVoters,
      totalGifts,
      totalGiftAmount
    });
  };

  // Recalculate stats when filter changes
  useEffect(() => {
    if (allVotes.length > 0 || allGifts.length > 0) {
      calculateStats(allVotes, allGifts, filterType);
    }
  }, [filterType]);

  // Get current display data based on filter
  const getDisplayData = useMemo(() => {
    let data = [];
    
    if (filterType === 'votes') {
      data = [...allVotes];
    } else if (filterType === 'gifts') {
      data = [...allGifts];
    } else {
      data = [...allVotes, ...allGifts].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter(tx => {
        const display = tx.display_name?.toLowerCase() || '';
        const email = tx.guest_email?.toLowerCase() || '';
        const ref = tx.reference?.toLowerCase() || '';
        const giftName = tx.gift_name?.toLowerCase() || '';
        return display.includes(searchLower) || 
               email.includes(searchLower) || 
               ref.includes(searchLower) ||
               giftName.includes(searchLower);
      });
    }

    // Apply sorting
    data.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'highestAmount') {
        const amountA = a.type === 'gift' ? a.amount : a.total_amount;
        const amountB = b.type === 'gift' ? b.amount : b.total_amount;
        return amountB - amountA;
      } else if (sortBy === 'lowestAmount') {
        const amountA = a.type === 'gift' ? a.amount : a.total_amount;
        const amountB = b.type === 'gift' ? b.amount : b.total_amount;
        return amountA - amountB;
      }
      return 0;
    });

    return data;
  }, [allVotes, allGifts, filterType, searchTerm, sortBy]);

  // Helper functions
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
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

  const getTransactionColor = (transaction) => {
    if (transaction.type === 'gift') {
      return transaction.gift_color || 'from-purple-500 to-pink-500';
    }
    return 'from-[#D4AF37] to-yellow-500';
  };

  const getTransactionAmount = (transaction) => {
    if (transaction.type === 'gift') {
      return transaction.amount || 0;
    }
    return transaction.total_amount || 0;
  };

  const getInitials = (transaction) => {
    const display = transaction.display_name || 'Anonymous';
    return display.charAt(0).toUpperCase();
  };

  const exportToCSV = () => {
    const data = getDisplayData;
    const headers = ['Type', 'Voter', 'Email', 'Item', 'Amount (NGN)', 'Reference', 'Date'];
    const csvData = data.map(t => {
      const type = t.type === 'vote' ? 'Vote' : 'Gift';
      const item = t.type === 'vote' ? `${t.votes} votes` : `${t.gift_emoji || ''} ${t.gift_name || ''}`;
      return [
        type,
        t.display_name || 'Anonymous',
        t.guest_email || 'N/A',
        item,
        getTransactionAmount(t) || 0,
        t.reference || 'N/A',
        formatDate(t.created_at)
      ];
    });
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/70 text-sm">Loading transactions...</p>
        </div>
      </div>
    );
  }

  const displayData = getDisplayData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${username}`}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-[14px] !text-base sm:!text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
                  {filterType === 'votes' ? 'My Voters' : filterType === 'gifts' ? 'Gift Supporters' : 'Supporters & Gifts'}
                </h1>
                <p className="text-[10px] sm:text-xs text-white/40">
                  {filterType === 'votes' && `${stats.uniqueVoters} unique voters • ${stats.totalVotes} total votes • ₦${stats.totalAmount.toLocaleString()}`}
                  {filterType === 'gifts' && `${stats.totalGifts} gifts sent • ₦${stats.totalGiftAmount.toLocaleString()} • ${stats.uniqueVoters} unique senders`}
                  {filterType === 'all' && `${stats.uniqueVoters} unique supporters • ${stats.totalVotes} total votes • ${stats.totalGifts} gifts • ₦${(stats.totalAmount + stats.totalGiftAmount).toLocaleString()}`}
                </p>
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-xl text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-8 sm:pr-10 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Filter Type Buttons */}
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-all ${
                    filterType === 'all' 
                      ? 'bg-[#D4AF37] text-black' 
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('votes')}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-all flex items-center gap-1 ${
                    filterType === 'votes' 
                      ? 'bg-[#D4AF37] text-black' 
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  <Vote className="w-3 h-3" />
                  <span className="hidden sm:inline">Votes</span>
                </button>
                <button
                  onClick={() => setFilterType('gifts')}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-all flex items-center gap-1 ${
                    filterType === 'gifts' 
                      ? 'bg-[#D4AF37] text-black' 
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  <span className="hidden sm:inline">Gifts</span>
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highestAmount">Highest Amount</option>
                <option value="lowestAmount">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {displayData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {filterType === 'votes' ? (
                <Vote className="w-10 h-10 text-[#D4AF37]" />
              ) : filterType === 'gifts' ? (
                <Gift className="w-10 h-10 text-[#D4AF37]" />
              ) : (
                <Users className="w-10 h-10 text-[#D4AF37]" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {filterType === 'votes' && 'No votes yet'}
              {filterType === 'gifts' && 'No gifts yet'}
              {filterType === 'all' && 'No transactions yet'}
            </h3>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              {filterType === 'votes' && 'When people vote for you, they\'ll appear here.'}
              {filterType === 'gifts' && 'When people send gifts, they\'ll appear here.'}
              {filterType === 'all' && 'When people vote or send gifts, they\'ll appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayData.map((transaction) => (
              <motion.div
                key={`${transaction.type}_${transaction.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Voter Avatar */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTransactionColor(transaction)} flex items-center justify-center flex-shrink-0`}>
                      {transaction.profile_data?.avatar_url ? (
                        <Image
                          src={transaction.profile_data.avatar_url}
                          alt={transaction.display_name || 'User'}
                          width={40}
                          height={40}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {getInitials(transaction)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm sm:text-base">
                          {transaction.display_name || 'Anonymous'}
                        </span>
                        {transaction.profile_data?.username && (
                          <span className="text-[10px] sm:text-xs text-white/40">
                            @{transaction.profile_data.username}
                          </span>
                        )}
                        {transaction.guest_email && (
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-white/40">
                            <Mail className="w-3 h-3" />
                            {transaction.guest_email}
                          </span>
                        )}
                      </div>
                      
                      {/* Reference */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] sm:text-xs text-white/40 font-mono flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Ref: {transaction.reference?.substring(0, 12)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(transaction.reference)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy reference"
                        >
                          {copiedRef === transaction.reference ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-white/40 hover:text-white/60" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 ml-13 sm:ml-0">
                    {/* Transaction Type Badge */}
                    <div className="text-center min-w-[60px] sm:min-w-[70px]">
                      {transaction.type === 'gift' ? (
                        <div className="text-2xl sm:text-3xl">
                          {transaction.gift_emoji || '🎁'}
                        </div>
                      ) : (
                        <div className="text-[#D4AF37] text-sm sm:text-base font-bold">
                          {transaction.votes || 0}
                          <span className="block text-[8px] sm:text-[10px] text-white/40">votes</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center min-w-[70px] sm:min-w-[80px]">
                      <div className="text-xs sm:text-sm font-semibold text-[#D4AF37]">
                        ₦{getTransactionAmount(transaction)?.toLocaleString() || 0}
                      </div>
                      <div className="text-[8px] sm:text-[10px] text-white/40">amount</div>
                    </div>
                    
                    {transaction.type === 'gift' && (
                      <div className="text-center min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xs text-white/60">
                          {transaction.gift_name || 'Gift'}
                        </div>
                        <div className="text-[8px] sm:text-[10px] text-white/40">gift</div>
                      </div>
                    )}
                    
                    <div className="text-center min-w-[70px] sm:min-w-[80px] hidden sm:block">
                      <div className="text-xs text-white/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-white/40">date</div>
                    </div>
                  </div>
                </div>

                {/* Mobile Date */}
                <div className="sm:hidden mt-3 pt-3 border-t border-white/10 text-[10px] text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(transaction.created_at)}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {(allVotes.length > 0 || allGifts.length > 0) && (
          <div className="mt-6 p-4 bg-gradient-to-r from-[#D4AF37]/10 to-yellow-500/10 rounded-xl border border-[#D4AF37]/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {filterType === 'votes' && (
                <>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Voters</div>
                    <div className="text-base sm:text-lg font-bold text-white">{stats.uniqueVoters}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Votes</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">{stats.totalVotes}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Amount</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">₦{stats.totalAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Avg Votes</div>
                    <div className="text-base sm:text-lg font-bold text-white">
                      {stats.uniqueVoters > 0 ? Math.round(stats.totalVotes / stats.uniqueVoters) : 0}
                    </div>
                  </div>
                </>
              )}

              {filterType === 'gifts' && (
                <>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Senders</div>
                    <div className="text-base sm:text-lg font-bold text-white">{stats.uniqueVoters}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Gifts</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">{stats.totalGifts}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Gift Amount</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">₦{stats.totalGiftAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Avg Gift</div>
                    <div className="text-base sm:text-lg font-bold text-white">
                      {stats.totalGifts > 0 ? Math.round(stats.totalGiftAmount / stats.totalGifts) : 0}
                    </div>
                  </div>
                </>
              )}

              {filterType === 'all' && (
                <>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Supporters</div>
                    <div className="text-base sm:text-lg font-bold text-white">{stats.uniqueVoters}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Votes</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">{stats.totalVotes}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Gifts</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">{stats.totalGifts}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs text-white/40">Total Amount</div>
                    <div className="text-base sm:text-lg font-bold text-[#D4AF37]">
                      ₦{(stats.totalAmount + stats.totalGiftAmount).toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}