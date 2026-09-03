// components/admin/VotersView.js
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
  Vote,
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

export default function VotersView() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [votersMap, setVotersMap] = useState({});
  const [candidatesMap, setCandidatesMap] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [minVotes, setMinVotes] = useState('');
  const [maxVotes, setMaxVotes] = useState('');
  const [showStats, setShowStats] = useState(true);
  
  // Show voters toggle
  const [showVoters, setShowVoters] = useState(true);
  const [isTogglingVoters, setIsTogglingVoters] = useState(false);
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
    fetchVoterSettings();
  }, [currentPage]);

  // Filter transactions when searchTerm, searchType, or transactions change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, searchType, transactions, dateFilter, minVotes, maxVotes]);

  const fetchVoterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('show_voters')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setShowVoters(data.show_voters === true);
      }
    } catch (error) {
      console.error('Error fetching voter settings:', error);
    }
  };

  const toggleShowVoters = async (newState) => {
    setIsTogglingVoters(true);
    try {
      // Check if record exists
      const { data: existing, error: checkError } = await supabase
        .from('who_win')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existing) {
        // Update existing record
        result = await supabase
          .from('who_win')
          .update({ show_voters: newState })
          .eq('id', existing.id);
      } else {
        // Insert new record
        result = await supabase
          .from('who_win')
          .insert({ show_voters: newState });
      }

      if (result.error) throw result.error;

      setShowVoters(newState);
      setShowConfirmModal(false);
      setPendingToggleState(null);

    } catch (error) {
      console.error('Error toggling voter visibility:', error);
      alert('Failed to update voter visibility settings. Please try again.');
    } finally {
      setIsTogglingVoters(false);
    }
  };

  const handleVoterToggle = (newState) => {
    setPendingToggleState(newState);
    setShowConfirmModal(true);
  };

  const confirmToggle = () => {
    if (pendingToggleState !== null) {
      toggleShowVoters(pendingToggleState);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vote_transactions')
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

      // Fetch profile names
      if (data && data.length > 0) {
        const voterIds = data
          .filter(tx => tx.user_id)
          .map(tx => tx.user_id);

        const candidateIds = data
          .filter(tx => tx.candidate_id)
          .map(tx => tx.candidate_id);

        const allProfileIds = [...new Set([...voterIds, ...candidateIds])];

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
            
            setVotersMap(map);
            setCandidatesMap(map);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => {
        const voterName = getVoterName(tx).toLowerCase();
        const candidateName = getCandidateName(tx).toLowerCase();
        const candidateUsername = getCandidateUsername(tx)?.toLowerCase() || '';
        const email = getVoterEmail(tx)?.toLowerCase() || '';
        const ref = tx.reference?.toLowerCase() || '';

        switch (searchType) {
          case 'voter':
            return voterName.includes(term);
          case 'candidate':
            return candidateName.includes(term) || candidateUsername.includes(term);
          case 'email':
            return email.includes(term);
          case 'reference':
            return ref.includes(term);
          default:
            return voterName.includes(term) || 
                   candidateName.includes(term) || 
                   candidateUsername.includes(term) ||
                   email.includes(term) ||
                   ref.includes(term);
        }
      });
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate.toDateString() === filterDate.toDateString();
      });
    }

    // Votes range filter
    if (minVotes) {
      filtered = filtered.filter(tx => (tx.votes || 0) >= parseInt(minVotes));
    }
    if (maxVotes) {
      filtered = filtered.filter(tx => (tx.votes || 0) <= parseInt(maxVotes));
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchType('all');
    setDateFilter('');
    setMinVotes('');
    setMaxVotes('');
    setIsFilterOpen(false);
  };

  const getVoterName = (transaction) => {
    if (transaction.guest_name) {
      return transaction.guest_name;
    } else if (transaction.user_id && votersMap[transaction.user_id]) {
      return votersMap[transaction.user_id].full_name || votersMap[transaction.user_id].username;
    } else if (transaction.guest_email) {
      return transaction.guest_email.split('@')[0];
    }
    return 'Anonymous Voter';
  };

  const getVoterEmail = (transaction) => {
    if (transaction.guest_email) {
      return transaction.guest_email;
    } else if (transaction.user_id && votersMap[transaction.user_id]) {
      return 'Registered User';
    }
    return null;
  };

  const getCandidateName = (transaction) => {
    if (transaction.candidate_id && candidatesMap[transaction.candidate_id]) {
      return candidatesMap[transaction.candidate_id].full_name || candidatesMap[transaction.candidate_id].username;
    }
    return 'Unknown Candidate';
  };

  const getCandidateUsername = (transaction) => {
    if (transaction.candidate_id && candidatesMap[transaction.candidate_id]) {
      return candidatesMap[transaction.candidate_id].username;
    }
    return null;
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
    const headers = ['Voter Name', 'Email', 'Candidate', 'Username', 'Votes', 'Amount (NGN)', 'Reference', 'Date'];
    
    const csvData = dataToExport.map(t => [
      getVoterName(t),
      getVoterEmail(t) || 'N/A',
      getCandidateName(t),
      getCandidateUsername(t) || 'N/A',
      t.votes || 0,
      t.total_amount || 0,
      t.reference || 'N/A',
      formatDate(t.created_at)
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voters_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStats = (data) => {
    const totalVotes = data.reduce((sum, t) => sum + (t.votes || 0), 0);
    const totalAmount = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const uniqueVoters = new Set(data.map(t => t.user_id || t.guest_email).filter(Boolean)).size;
    return { totalVotes, totalAmount, uniqueVoters };
  };

  const displayData = filteredTransactions.length > 0 ? filteredTransactions : transactions;
  const stats = getStats(displayData);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const searchOptions = [
    { value: 'all', label: 'All Fields' },
    { value: 'voter', label: 'Voter Name' },
    { value: 'candidate', label: 'Candidate Name' },
    { value: 'email', label: 'Email' },
    { value: 'reference', label: 'Reference' },
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
                  <div className="p-1.5 bg-gradient-to-r from-burnt-orange-500/20 to-yellow-500/20 rounded-lg">
                    <Vote className="w-4 h-4 text-burnt-orange-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Total Votes</div>
                    <div className="text-lg font-bold text-burnt-orange-400">{stats.totalVotes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="w-px h-10 bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                    <Users className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Unique Voters</div>
                    <div className="text-lg font-bold text-green-400">{stats.uniqueVoters.toLocaleString()}</div>
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
              </div>

              <div className="flex items-center gap-2">
                {/* Show Voters Toggle */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                  <button
                    onClick={() => handleVoterToggle(!showVoters)}
                    disabled={isTogglingVoters}
                    className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showVoters ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-green-400" />
                        <span>Showing Voters</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-red-400" />
                        <span>Voters Hidden</span>
                      </>
                    )}
                    {isTogglingVoters && <Loader className="w-3 h-3 animate-spin ml-1" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/60"
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className="text-[10px] text-white/30">
                  {displayData.length} of {totalCount} transactions
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 w-full relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Search className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Search voters, candidates, emails, references..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-burnt-orange-500 focus:outline-none transition-all"
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

          {/* Search Type Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-burnt-orange-500 focus:outline-none transition-colors appearance-none min-w-[120px]"
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
                isFilterOpen || dateFilter || minVotes || maxVotes
                  ? 'bg-burnt-orange-500/20 text-burnt-orange-400 border border-burnt-orange-500/30'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={exportToCSV}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-burnt-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Min Votes</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minVotes}
                    onChange={(e) => setMinVotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-burnt-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Max Votes</label>
                  <input
                    type="number"
                    placeholder="∞"
                    value={maxVotes}
                    onChange={(e) => setMaxVotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-burnt-orange-500 focus:outline-none transition-colors"
                  />
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
                    className="px-4 py-2 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Export Button */}
        <div className="sm:hidden mt-3">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===== TRANSACTIONS TABLE ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-burnt-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {displayData.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">No transactions found</p>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-base">
                        {getVoterName(transaction).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">
                        {getVoterName(transaction)}
                      </div>
                      {getVoterEmail(transaction) && (
                        <div className="flex items-center gap-1 text-xs text-white/40 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getVoterEmail(transaction)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-burnt-orange-400">{transaction.votes} votes</div>
                      <div className="text-xs text-yellow-400">₦{transaction.total_amount?.toLocaleString() || 0}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/60">
                      <Award className="w-3 h-3 text-burnt-orange-400" />
                      <span>{getCandidateName(transaction)}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-white/40">@{getCandidateUsername(transaction) || 'unknown'}</span>
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
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Voter</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Contact</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Candidate</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Username</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Votes</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Amount</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Reference</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-white/40">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm">No transactions match your filters</p>
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-xs">
                                {getVoterName(transaction).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-white">
                              {getVoterName(transaction)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          {getVoterEmail(transaction) ? (
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{getVoterEmail(transaction)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-white/30">No email</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-burnt-orange-400 flex-shrink-0" />
                            <span className="text-sm text-white/80 font-medium">
                              {getCandidateName(transaction)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-white/40 font-mono">
                            @{getCandidateUsername(transaction) || 'unknown'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-1 bg-burnt-orange-500/20 rounded-full text-sm font-semibold text-burnt-orange-400">
                            {transaction.votes}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-semibold text-yellow-400">
                            ₦{transaction.total_amount?.toLocaleString() || 0}
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
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} transactions
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
                            ? 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
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

      {/* ===== CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-yellow-400/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-yellow-400/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {pendingToggleState ? 'Show Voters?' : 'Hide Voters?'}
                </h3>
                <p className="text-white/60 text-sm">
                  {pendingToggleState 
                    ? 'Are you sure you want housemates to see who is voting for them? This will make voter information visible to all.'
                    : 'Are you sure you want to hide voters from housemates? This will make voter information private.'
                  }
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingToggleState(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={isTogglingVoters}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isTogglingVoters ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
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