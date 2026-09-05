// components/admin/ProfileManagement.js
'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Loader,
  AlertCircle,
  Eye,
  EyeOff,
  Share2,
  Vote,
  ToggleLeft,
  ToggleRight,
  Gift,
  DollarSign,
  ExternalLink,
  Check,
  ChevronDown,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfileManagement() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [voteStats, setVoteStats] = useState({});
  const [giftStats, setGiftStats] = useState({});
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [showBulkVerificationDropdown, setShowBulkVerificationDropdown] = useState(false);
  const [voteVisibilityOn, setVoteVisibilityOn] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const accountStatusOptions = [
    { value: 'pending_verification', label: 'Pending Verification', color: 'yellow' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'suspended', label: 'Suspended', color: 'red' },
    { value: 'deactivated', label: 'Deactivated', color: 'gray' }
  ];

  const verificationLevelOptions = [
    { value: 'unverified', label: 'Unverified', color: 'gray' },
    { value: 'fully_verified', label: 'Fully Verified', color: 'blue' }
  ];

  useEffect(() => {
    fetchProfiles();
  }, [currentPage, statusFilter, verificationFilter, searchTerm]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`
          username.ilike.%${searchTerm}%,
          full_name.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%
        `);
      }

      if (statusFilter !== 'all') {
        query = query.eq('account_status', statusFilter);
      }

      if (verificationFilter !== 'all') {
        query = query.eq('verification_level', verificationFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sort profiles: admins first, then others
      const sortedData = (data || []).sort((a, b) => {
        // If a is admin and b is not, a comes first
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        // If b is admin and a is not, b comes first
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        // If both are admin or both are not, sort by created_at
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setProfiles(sortedData);
      setTotalCount(count || 0);

      const { data: visibilityData, error: visibilityError } = await supabase
        .from('profiles')
        .select('vote_visibility');

      if (!visibilityError && visibilityData?.length > 0) {
        setVoteVisibilityOn(visibilityData.every(profile => profile.vote_visibility === 'on'));
      }

      if (data && data.length > 0) {
        const profileIds = data.map(p => p.id);
        
        const { data: voteData } = await supabase
          .from('vote_statistics')
          .select('candidate_id, total_votes')
          .in('candidate_id', profileIds);

        const { data: voteAmountData } = await supabase
          .from('vote_transactions')
          .select('candidate_id, total_amount')
          .eq('status', 'completed')
          .in('candidate_id', profileIds);

        const voteStatsMap = {};
        
        if (voteData) {
          voteData.forEach(stat => {
            if (!voteStatsMap[stat.candidate_id]) {
              voteStatsMap[stat.candidate_id] = { totalVotes: 0, totalAmount: 0 };
            }
            voteStatsMap[stat.candidate_id].totalVotes = stat.total_votes || 0;
          });
        }

        if (voteAmountData) {
          voteAmountData.forEach(vote => {
            if (!voteStatsMap[vote.candidate_id]) {
              voteStatsMap[vote.candidate_id] = { totalVotes: 0, totalAmount: 0 };
            }
            voteStatsMap[vote.candidate_id].totalAmount = (voteStatsMap[vote.candidate_id].totalAmount || 0) + (vote.total_amount || 0);
          });
        }

        setVoteStats(voteStatsMap);

        const { data: giftData } = await supabase
          .from('gift_transactions')
          .select('candidate_id, amount')
          .eq('status', 'completed')
          .in('candidate_id', profileIds);

        if (giftData) {
          const giftStatsMap = giftData.reduce((acc, gift) => {
            if (!acc[gift.candidate_id]) {
              acc[gift.candidate_id] = { count: 0, totalAmount: 0 };
            }
            acc[gift.candidate_id].count += 1;
            acc[gift.candidate_id].totalAmount += gift.amount || 0;
            return acc;
          }, {});
          setGiftStats(giftStatsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Direct status update - click to change
  const handleStatusClick = async (profileId, currentStatus) => {
    const options = accountStatusOptions;
    const currentIndex = options.findIndex(opt => opt.value === currentStatus);
    const nextIndex = (currentIndex + 1) % options.length;
    const newStatus = options[nextIndex].value;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, account_status: newStatus } : p
      ));

      console.log(`✅ Status changed to: ${newStatus}`);

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Direct verification update - click to change
  const handleVerificationClick = async (profileId, currentLevel) => {
    const options = verificationLevelOptions;
    const currentIndex = options.findIndex(opt => opt.value === currentLevel);
    const nextIndex = (currentIndex + 1) % options.length;
    const newLevel = options[nextIndex].value;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, verification_level: newLevel } : p
      ));

      console.log(`✅ Verification changed to: ${newLevel}`);

    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update verification. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (profile) => {
    setEditingId(profile.id);
    setEditForm({
      username: profile.username,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      country: profile.country || '',
      state: profile.state || '',
      city: profile.city || '',
      date_of_birth: profile.date_of_birth || '',
      account_status: profile.account_status || 'pending_verification',
      verification_level: profile.verification_level || 'unverified',
      bio: profile.bio || '',
      role: profile.role || 'user',
      social_control: profile.social_control || false,
      vote_control: profile.vote_control || false
    });
  };

  const handleToggleControl = async (profileId, controlName, currentValue) => {
    setUpdating(true);
    try {
      const newValue = !currentValue;
      const updateData = {
        [controlName]: newValue,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, [controlName]: newValue } : p
      ));

      if (editingId === profileId) {
        setEditForm(prev => ({ ...prev, [controlName]: newValue }));
      }

    } catch (error) {
      console.error(`Error toggling ${controlName}:`, error);
      alert(`Failed to update ${controlName}. Please try again.`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async (profileId) => {
    setUpdating(true);
    try {
      if (!editForm.username || !editForm.email) {
        throw new Error('Username and email are required');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone || null,
          country: editForm.country || null,
          state: editForm.state || null,
          city: editForm.city || null,
          date_of_birth: editForm.date_of_birth || null,
          account_status: editForm.account_status,
          verification_level: editForm.verification_level,
          bio: editForm.bio || null,
          role: editForm.role,
          social_control: editForm.social_control || false,
          vote_control: editForm.vote_control || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, ...editForm } : p
      ));

      setEditingId(null);
      setEditForm({});
      alert('Profile updated successfully!');

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (profileId) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.filter(p => p.id !== profileId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProfiles.length === 0) return;

    setUpdating(true);
    try {
      const updates = {};

      if (bulkAction.startsWith('status_')) {
        updates.account_status = bulkAction.replace('status_', '');
      } else if (bulkAction.startsWith('verification_')) {
        updates.verification_level = bulkAction.replace('verification_', '');
      } else if (bulkAction === 'social_on') {
        updates.social_control = true;
      } else if (bulkAction === 'social_off') {
        updates.social_control = false;
      } else if (bulkAction === 'vote_on') {
        updates.vote_control = true;
      } else if (bulkAction === 'vote_off') {
        updates.vote_control = false;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .in('id', selectedProfiles);

        if (error) throw error;

        setProfiles(profiles.map(p =>
          selectedProfiles.includes(p.id) ? { ...p, ...updates } : p
        ));
        setSelectedProfiles([]);
        setBulkAction('');
        alert(`✅ Bulk action completed for ${selectedProfiles.length} profiles`);
      }
    } catch (error) {
      console.error('Error in bulk action:', error);
      alert('Failed to perform bulk action');
    } finally {
      setUpdating(false);
    }
  };

  // Bulk toggle controls with single switch
  const handleBulkToggleControl = async (controlName, value) => {
    if (profiles.length === 0) return;

    setUpdating(true);
    try {
      const profileIds = profiles.map(p => p.id);
      const updateData = {
        [controlName]: value,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', profileIds);

      if (error) throw error;

      setProfiles(profiles.map(p => ({ ...p, [controlName]: value })));

      const label = controlName === 'social_control' ? 'Social' : 'Vote';
      const state = value ? 'ON' : 'OFF';
      alert(`✅ ${label} ${state} for all ${profiles.length} profiles`);

    } catch (error) {
      console.error(`Error bulk toggling ${controlName}:`, error);
      alert(`Failed to update ${controlName} for all profiles.`);
    } finally {
      setUpdating(false);
    }
  };

  const handleVoteVisibilityToggle = async () => {
    const nextVisibility = voteVisibilityOn ? 'off' : 'on';
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          vote_visibility: nextVisibility,
          updated_at: new Date().toISOString()
        })
        .not('id', 'is', null);

      if (error) throw error;

      setVoteVisibilityOn(nextVisibility === 'on');
      setProfiles(profiles.map(profile => ({
        ...profile,
        vote_visibility: nextVisibility
      })));
      alert(`✅ Vote visibility turned ${nextVisibility.toUpperCase()} for all profiles`);
    } catch (error) {
      console.error('Error updating vote visibility:', error?.message || error, error?.details || '');
      alert('Failed to update vote visibility for all profiles.');
    } finally {
      setUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Username', 'Full Name', 'Email', 'Phone', 'Country', 'State',
      'City', 'Date of Birth', 'Account Status', 'Verification Level',
      'Role', 'Bio', 'Total Votes', 'Vote Amount (NGN)', 'Total Gifts', 'Gift Amount (NGN)', 'Social Control', 'Vote Control'
    ];

    const csvData = profiles.map(p => {
      const voteStat = voteStats[p.id] || { totalVotes: 0, totalAmount: 0 };
      const giftStat = giftStats[p.id] || { count: 0, totalAmount: 0 };

      return [
        p.username,
        p.full_name,
        p.email,
        p.phone || '',
        p.country || '',
        p.state || '',
        p.city || '',
        p.date_of_birth || '',
        p.account_status || 'pending_verification',
        p.verification_level || 'unverified',
        p.role || 'user',
        (p.bio || '').replace(/,/g, ';'),
        voteStat.totalVotes || 0,
        voteStat.totalAmount || 0,
        giftStat.count || 0,
        giftStat.totalAmount || 0,
        p.social_control ? 'Enabled' : 'Disabled',
        p.vote_control ? 'Enabled' : 'Disabled'
      ];
    });

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadgeColor = (status) => {
    const option = accountStatusOptions.find(opt => opt.value === status);
    switch(option?.color) {
      case 'green': return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30';
      case 'yellow': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
    }
  };

  const getVerificationBadgeColor = (level) => {
    const option = verificationLevelOptions.find(opt => opt.value === level);
    switch(option?.color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const ControlToggle = ({ profile, controlName, label, icon: Icon, onToggle }) => {
    const isEnabled = profile[controlName] === true;
    const color = isEnabled ? 'text-green-400' : 'text-gray-400';

    return (
      <button
        onClick={() => onToggle(profile.id, controlName, isEnabled)}
        disabled={updating}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          isEnabled
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        } hover:opacity-80 disabled:opacity-50`}
        title={isEnabled ? `Click to disable ${label}` : `Click to enable ${label}`}
      >
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span>{isEnabled ? 'ON' : 'OFF'}</span>
        {isEnabled ? (
          <ToggleRight className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
    );
  };

  const getVoteDisplay = (profileId) => {
    const stat = voteStats[profileId];
    if (!stat) return { votes: 0, amount: 0 };
    return {
      votes: stat.totalVotes || 0,
      amount: stat.totalAmount || 0
    };
  };

  const getGiftDisplay = (profileId) => {
    const stat = giftStats[profileId];
    if (!stat) return { count: 0, amount: 0 };
    return {
      count: stat.count || 0,
      amount: stat.totalAmount || 0
    };
  };

  // Get all profiles on current page for bulk selection
  const allCurrentPageIds = profiles.map(p => p.id);

  return (
    <div>
      {/* Bulk Controls - Enhanced */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs sm:text-sm text-white/60 font-medium">Bulk Controls ({profiles.length} profiles)</span>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Bulk Control */}
            <div className="relative">
              <button
                onClick={() => setShowBulkStatusDropdown(!showBulkStatusDropdown)}
                disabled={profiles.length === 0}
                className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Status</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBulkStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showBulkStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden"
                  >
                    {accountStatusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleBulkToggleControl('account_status', opt.value);
                          setShowBulkStatusDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full bg-${opt.color}-400`}></div>
                        Set {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Verification Bulk Control */}
            <div className="relative">
              <button
                onClick={() => setShowBulkVerificationDropdown(!showBulkVerificationDropdown)}
                disabled={profiles.length === 0}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Verification</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBulkVerificationDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showBulkVerificationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden"
                  >
                    {verificationLevelOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleBulkToggleControl('verification_level', opt.value);
                          setShowBulkVerificationDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full bg-${opt.color}-400`}></div>
                        Set {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Social Toggle - Single Switch */}
            <button
              onClick={() => {
                const allOn = profiles.every(p => p.social_control === true);
                handleBulkToggleControl('social_control', !allOn);
              }}
              disabled={profiles.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                profiles.length > 0 && profiles.every(p => p.social_control === true)
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social {profiles.length > 0 && profiles.every(p => p.social_control === true) ? 'ON' : 'OFF'}</span>
            </button>

            {/* Vote Toggle - Single Switch */}
            <button
              onClick={() => {
                const allOn = profiles.every(p => p.vote_control === true);
                handleBulkToggleControl('vote_control', !allOn);
              }}
              disabled={profiles.length === 0}
              title="Candidates vote counts will be invisible to visitors if turned off."
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                profiles.length > 0 && profiles.every(p => p.vote_control === true)
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Show Vote to Visitors {profiles.length > 0 && profiles.every(p => p.vote_control === true) ? 'ON' : 'OFF'}</span>
            </button>

            {/* Global Vote Visibility Toggle */}
            <button
              onClick={handleVoteVisibilityToggle}
              disabled={updating}
              title="Candidates vote counts will be invisible to everyone if turned off."
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                voteVisibilityOn
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              {voteVisibilityOn ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Show Vote to Everyone {voteVisibilityOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by username, name, email, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:border-burnt-orange-500 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-40 px-3 py-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-black focus:border-yellow-500 focus:outline-none transition-colors"
          >
            <option value="all" className="bg-gray-900 text-white">All Status</option>
            {accountStatusOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">{opt.label}</option>
            ))}
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-40 px-3 py-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-black focus:border-yellow-500 focus:outline-none transition-colors"
          >
            <option value="all" className="bg-gray-900 text-white">All Verification</option>
            {verificationLevelOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">{opt.label}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="sm:hidden space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:border-burnt-orange-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-2 py-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-black focus:border-yellow-500 focus:outline-none transition-colors"
            >
              <option value="all" className="bg-gray-900 text-white">Status</option>
              {accountStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">{opt.label}</option>
              ))}
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-2 py-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-black focus:border-yellow-500 focus:outline-none transition-colors"
            >
              <option value="all" className="bg-gray-900 text-white">Verification</option>
              {verificationLevelOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">{opt.label}</option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-1"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProfiles.length > 0 && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-burnt-orange-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm text-white">
            {selectedProfiles.length} profile(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-burnt-orange-500 focus:outline-none transition-colors"
            >
              <option value="">Bulk Actions</option>
              <optgroup label="Account Status">
                {accountStatusOptions.map(opt => (
                  <option key={opt.value} value={`status_${opt.value}`}>
                    Set Status: {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Verification Level">
                {verificationLevelOptions.map(opt => (
                  <option key={opt.value} value={`verification_${opt.value}`}>
                    Set Verification: {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Social Control">
                <option value="social_on">Enable Social Links</option>
                <option value="social_off">Disable Social Links</option>
              </optgroup>
              <optgroup label="Vote Control">
                <option value="vote_on">Enable Vote Visibility</option>
                <option value="vote_off">Disable Vote Visibility</option>
              </optgroup>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || updating}
              className="px-3 py-1.5 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={() => setSelectedProfiles([])}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* Profiles Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-burnt-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProfiles.length === profiles.length && profiles.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProfiles(profiles.map(p => p.id));
                          } else {
                            setSelectedProfiles([]);
                          }
                        }}
                        className="rounded border-white/20 bg-white/5 text-burnt-orange-500 focus:ring-burnt-orange-500"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">User</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Contact</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Location</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Status</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Verification</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Role</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Votes</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Gifts</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Controls</th>
                    <th className="p-3 text-left text-xs font-medium text-white/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const voteData = getVoteDisplay(profile.id);
                    const giftData = getGiftDisplay(profile.id);
                    const isAdmin = profile.role === 'admin';

                    return (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                          isAdmin ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border-l-2 border-l-yellow-500' : ''
                        }`}
                      >
                        {editingId === profile.id ? (
                          // Edit Mode
                          <>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedProfiles.includes(profile.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProfiles([...selectedProfiles, profile.id]);
                                  } else {
                                    setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                                  }
                                }}
                                className="rounded border-white/20 bg-white/5 text-burnt-orange-500 focus:ring-burnt-orange-500"
                              />
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editForm.username}
                                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Username"
                                />
                                <input
                                  type="text"
                                  value={editForm.full_name}
                                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Full Name"
                                />
                                <textarea
                                  value={editForm.bio}
                                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Bio"
                                  rows="2"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Email"
                                />
                                <input
                                  type="tel"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Phone"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editForm.country}
                                  onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="Country"
                                />
                                <input
                                  type="text"
                                  value={editForm.state}
                                  onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="State"
                                />
                                <input
                                  type="text"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                                  placeholder="City"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                value={editForm.account_status}
                                onChange={(e) => setEditForm({...editForm, account_status: e.target.value})}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              >
                                {accountStatusOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={editForm.verification_level}
                                onChange={(e) => setEditForm({...editForm, verification_level: e.target.value})}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              >
                                {verificationLevelOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white"
                              >
                                <option value="user">User</option>
                                <option value="celebrity">Celebrity</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-burnt-orange-400">
                                  {voteData.votes} votes
                                </div>
                                <div className="text-[10px] text-white/40">
                                  ₦{voteData.amount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-pink-400">
                                  {giftData.count} gifts
                                </div>
                                <div className="text-[10px] text-white/40">
                                  ₦{giftData.amount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-white/40">Social:</span>
                                  <ControlToggle
                                    profile={editForm}
                                    controlName="social_control"
                                    label="Social Links"
                                    icon={Share2}
                                    onToggle={(id, name, value) => {
                                      setEditForm(prev => ({
                                        ...prev,
                                        [name]: !value
                                      }));
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-white/40">Votes:</span>
                                  <ControlToggle
                                    profile={editForm}
                                    controlName="vote_control"
                                    label="Votes"
                                    icon={Vote}
                                    onToggle={(id, name, value) => {
                                      setEditForm(prev => ({
                                        ...prev,
                                        [name]: !value
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSaveEdit(profile.id)}
                                  disabled={updating}
                                  className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4 text-green-400" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedProfiles.includes(profile.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProfiles([...selectedProfiles, profile.id]);
                                  } else {
                                    setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                                  }
                                }}
                                className="rounded border-white/20 bg-white/5 text-burnt-orange-500 focus:ring-burnt-orange-500"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 overflow-hidden flex-shrink-0">
                                    {profile.avatar_url ? (
                                      <Image
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <div className="absolute -top-1 -right-1">
                                      <Shield className="w-3.5 h-3.5 text-yellow-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white text-sm">{profile.full_name}</span>
                                    {isAdmin && (
                                      <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-white/40">@{profile.username}</div>
                                  {profile.bio && (
                                    <div className="text-xs text-white/60 mt-1 line-clamp-2">{profile.bio}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs">
                                  <Mail className="w-3 h-3 text-white/40" />
                                  <span className="text-white/80">{profile.email}</span>
                                </div>
                                {profile.phone && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Phone className="w-3 h-3 text-white/40" />
                                    <span className="text-white/80">{profile.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {profile.country && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <MapPin className="w-3 h-3 text-white/40" />
                                    <span className="text-white/80">{profile.country}</span>
                                  </div>
                                )}
                                {(profile.state || profile.city) && (
                                  <div className="text-xs text-white/60">
                                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                {profile.date_of_birth && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Calendar className="w-3 h-3 text-white/40" />
                                    <span className="text-white/60">
                                      {new Date(profile.date_of_birth).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleStatusClick(profile.id, profile.account_status)}
                                disabled={updating}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${getStatusBadgeColor(profile.account_status)}`}
                                title={`Click to change status (currently ${accountStatusOptions.find(opt => opt.value === profile.account_status)?.label || 'Unknown'})`}
                              >
                                {accountStatusOptions.find(opt => opt.value === profile.account_status)?.label || 'Unknown'}
                                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                              </button>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleVerificationClick(profile.id, profile.verification_level)}
                                disabled={updating}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${getVerificationBadgeColor(profile.verification_level)}`}
                                title={`Click to change verification (currently ${verificationLevelOptions.find(opt => opt.value === profile.verification_level)?.label || 'Unknown'})`}
                              >
                                {verificationLevelOptions.find(opt => opt.value === profile.verification_level)?.label || 'Unknown'}
                                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                              </button>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                isAdmin 
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              }`}>
                                {profile.role || 'user'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-burnt-orange-400">
                                  {voteData.votes} votes
                                </div>
                                <div className="text-[10px] text-white/40">
                                  ₦{voteData.amount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-pink-400">
                                  {giftData.count} gifts
                                </div>
                                <div className="text-[10px] text-white/40">
                                  ₦{giftData.amount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1.5">
                                <ControlToggle
                                  profile={profile}
                                  controlName="social_control"
                                  label="Social Links"
                                  icon={Share2}
                                  onToggle={handleToggleControl}
                                />
                                <ControlToggle
                                  profile={profile}
                                  controlName="vote_control"
                                  label="Votes"
                                  icon={Vote}
                                  onToggle={handleToggleControl}
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/${profile.username}`}
                                  target="_blank"
                                  className="p-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                                  title="View Profile"
                                >
                                  <ExternalLink className="w-4 h-4 text-green-400" />
                                </Link>
                                <button
                                  onClick={() => handleEdit(profile)}
                                  className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-400" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(profile.id)}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tablet & Mobile Views - Keep existing but update status/verification click handlers */}
          <div className="hidden sm:block lg:hidden">
            {profiles.map((profile) => {
              const voteData = getVoteDisplay(profile.id);
              const giftData = getGiftDisplay(profile.id);
              const isAdmin = profile.role === 'admin';

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/5 rounded-xl border border-white/10 p-4 mb-3 ${
                    isAdmin ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border-l-2 border-l-yellow-500' : ''
                  }`}
                >
                  {editingId === profile.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">Edit Profile</h3>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 bg-red-500/20 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Username"
                        />
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Phone"
                        />
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Country"
                        />
                        <input
                          type="text"
                          value={editForm.state}
                          onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="State"
                        />
                      </div>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        placeholder="City"
                      />
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        placeholder="Bio"
                        rows="2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={editForm.account_status}
                          onChange={(e) => setEditForm({...editForm, account_status: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        >
                          {accountStatusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.verification_level}
                          onChange={(e) => setEditForm({...editForm, verification_level: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        >
                          {verificationLevelOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        >
                          <option value="user">User</option>
                          <option value="celebrity">Celebrity</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">Social:</span>
                          <ControlToggle
                            profile={editForm}
                            controlName="social_control"
                            label="Social Links"
                            icon={Share2}
                            onToggle={(id, name, value) => {
                              setEditForm(prev => ({ ...prev, [name]: !value }));
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">Votes:</span>
                          <ControlToggle
                            profile={editForm}
                            controlName="vote_control"
                            label="Votes"
                            icon={Vote}
                            onToggle={(id, name, value) => {
                              setEditForm(prev => ({ ...prev, [name]: !value }));
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveEdit(profile.id)}
                        disabled={updating}
                        className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        {updating ? (
                          <><Loader className="w-3 h-3 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-3 h-3" /> Save Changes</>
                        )}
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProfiles([...selectedProfiles, profile.id]);
                            } else {
                              setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                            }
                          }}
                          className="mt-1 rounded border-white/20 bg-white/5 text-burnt-orange-500 focus:ring-burnt-orange-500"
                        />
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 overflow-hidden flex-shrink-0">
                            {profile.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={profile.username}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="absolute -top-1 -right-1">
                              <Shield className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm truncate">{profile.full_name}</span>
                            {isAdmin && (
                              <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 truncate">@{profile.username}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <button
                              onClick={() => handleStatusClick(profile.id, profile.account_status)}
                              disabled={updating}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-all ${getStatusBadgeColor(profile.account_status)}`}
                              title="Click to change status"
                            >
                              {accountStatusOptions.find(opt => opt.value === profile.account_status)?.label || 'Unknown'}
                              <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                            </button>
                            <button
                              onClick={() => handleVerificationClick(profile.id, profile.verification_level)}
                              disabled={updating}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-all ${getVerificationBadgeColor(profile.verification_level)}`}
                              title="Click to change verification"
                            >
                              {verificationLevelOptions.find(opt => opt.value === profile.verification_level)?.label || 'Unknown'}
                              <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                            </button>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isAdmin 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            }`}>
                              {profile.role || 'user'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Link
                            href={`/${profile.username}`}
                            target="_blank"
                            className="p-2 bg-green-500/20 rounded-lg"
                            title="View Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-green-400" />
                          </Link>
                          <button
                            onClick={() => handleEdit(profile)}
                            className="p-2 bg-blue-500/20 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(profile.id)}
                            className="p-2 bg-red-500/20 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-white/40" />
                          <span className="text-white/80 truncate">{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-white/40" />
                            <span className="text-white/80 truncate">{profile.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-white/10">
                        <div>
                          <div className="text-[10px] text-white/40">Votes</div>
                          <div className="text-sm font-semibold text-burnt-orange-400">{voteData.votes}</div>
                          <div className="text-[10px] text-white/40">₦{voteData.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40">Gifts</div>
                          <div className="text-sm font-semibold text-pink-400">{giftData.count}</div>
                          <div className="text-[10px] text-white/40">₦{giftData.amount.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-white/40" />
                            <span className={`text-xs font-medium ${profile.social_control ? 'text-green-400' : 'text-gray-400'}`}>
                              {profile.social_control ? 'Social: ON' : 'Social: OFF'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Vote className="w-3.5 h-3.5 text-white/40" />
                            <span className={`text-xs font-medium ${profile.vote_control ? 'text-green-400' : 'text-gray-400'}`}>
                              {profile.vote_control ? 'Votes: ON' : 'Votes: OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Card View - Keep existing but update with clickable status/verification */}
          <div className="sm:hidden space-y-3">
            {profiles.map((profile) => {
              const voteData = getVoteDisplay(profile.id);
              const giftData = getGiftDisplay(profile.id);
              const isAdmin = profile.role === 'admin';

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/5 rounded-xl border border-white/10 p-3 ${
                    isAdmin ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border-l-2 border-l-yellow-500' : ''
                  }`}
                >
                  {/* Mobile View - Keeping it clean and simple */}
                  {editingId === profile.id ? (
                    // Mobile Edit Mode
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white">Edit Profile</h3>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 bg-red-500/20 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Username"
                        />
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Phone"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.country}
                            onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                            placeholder="Country"
                          />
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                            placeholder="State"
                          />
                        </div>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="City"
                        />
                        <input
                          type="date"
                          value={editForm.date_of_birth}
                          onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                        />
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          placeholder="Bio"
                          rows="2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={editForm.account_status}
                            onChange={(e) => setEditForm({...editForm, account_status: e.target.value})}
                            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          >
                            {accountStatusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <select
                            value={editForm.verification_level}
                            onChange={(e) => setEditForm({...editForm, verification_level: e.target.value})}
                            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          >
                            {verificationLevelOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="px-2 py-1.5 bg-white/10 border border-white/20 rounded text-xs text-white"
                          >
                            <option value="user">User</option>
                            <option value="celebrity">Celebrity</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Social:</span>
                            <ControlToggle
                              profile={editForm}
                              controlName="social_control"
                              label="Social Links"
                              icon={Share2}
                              onToggle={(id, name, value) => {
                                setEditForm(prev => ({ ...prev, [name]: !value }));
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Votes:</span>
                            <ControlToggle
                              profile={editForm}
                              controlName="vote_control"
                              label="Votes"
                              icon={Vote}
                              onToggle={(id, name, value) => {
                                setEditForm(prev => ({ ...prev, [name]: !value }));
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveEdit(profile.id)}
                          disabled={updating}
                          className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                        >
                          {updating ? (
                            <><Loader className="w-3 h-3 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-3 h-3" /> Save Changes</>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mobile View Mode
                    <>
                      <div className="flex items-start gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProfiles([...selectedProfiles, profile.id]);
                            } else {
                              setSelectedProfiles(selectedProfiles.filter(id => id !== profile.id));
                            }
                          }}
                          className="mt-1 rounded border-white/20 bg-white/5 text-burnt-orange-500 focus:ring-burnt-orange-500"
                        />
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 overflow-hidden flex-shrink-0">
                            {profile.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={profile.username}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="absolute -top-1 -right-1">
                              <Shield className="w-4 h-4 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm truncate">{profile.full_name}</span>
                            {isAdmin && (
                              <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 truncate">@{profile.username}</div>
                        </div>
                        <div className="flex gap-1">
                          <Link
                            href={`/${profile.username}`}
                            target="_blank"
                            className="p-2 bg-green-500/20 rounded-lg"
                            title="View Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-green-400" />
                          </Link>
                          <button
                            onClick={() => handleEdit(profile)}
                            className="p-2 bg-blue-500/20 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(profile.id)}
                            className="p-2 bg-red-500/20 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-white/40" />
                          <span className="text-white/80 truncate">{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-white/40" />
                            <span className="text-white/80 truncate">{profile.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        <button
                          onClick={() => handleStatusClick(profile.id, profile.account_status)}
                          disabled={updating}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-all ${getStatusBadgeColor(profile.account_status)}`}
                          title="Click to change status"
                        >
                          {accountStatusOptions.find(opt => opt.value === profile.account_status)?.label || 'Unknown'}
                          <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                        </button>
                        <button
                          onClick={() => handleVerificationClick(profile.id, profile.verification_level)}
                          disabled={updating}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer transition-all ${getVerificationBadgeColor(profile.verification_level)}`}
                          title="Click to change verification"
                        >
                          {verificationLevelOptions.find(opt => opt.value === profile.verification_level)?.label || 'Unknown'}
                          <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                        </button>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          isAdmin 
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        }`}>
                          {profile.role || 'user'}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-white/40">Votes</div>
                          <div className="text-sm font-semibold text-burnt-orange-400">{voteData.votes}</div>
                          <div className="text-[10px] text-white/40">₦{voteData.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/40">Gifts</div>
                          <div className="text-sm font-semibold text-pink-400">{giftData.count}</div>
                          <div className="text-[10px] text-white/40">₦{giftData.amount.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-white/40" />
                            <span className={`text-[10px] font-medium ${profile.social_control ? 'text-green-400' : 'text-gray-400'}`}>
                              {profile.social_control ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Vote className="w-3 h-3 text-white/40" />
                            <span className={`text-[10px] font-medium ${profile.vote_control ? 'text-green-400' : 'text-gray-400'}`}>
                              {profile.vote_control ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-6 max-w-md w-full"
                >
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-2">Delete Profile</h3>
                  <p className="text-sm text-white/60 text-center mb-6">
                    Are you sure you want to delete this profile? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(showDeleteConfirm)}
                      disabled={updating}
                      className="flex-1 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-white/40">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} profiles
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <span className="text-sm text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}