// /components/profile/ProfileBanner.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Loader, Check, X, AlertCircle, Heart, Edit3, Upload, Gift, Award, Shield, Wallet, Building2, CreditCard, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BankDetails from './BankDetails';

export default function ProfileBanner({ 
  profile, 
  isOwner, 
  uploadingPhoto, 
  uploadSuccess,
  onPhotoUpload,
  onSettingsClick,
  onVoteClick,
  isVoteModalOpen,
  onUpdateProfile
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const [bannerError, setBannerError] = useState(null);
  const [voteCount, setVoteCount] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const bannerInputRef = useRef(null);

  // ===== Bank Details state =====
  const [showBankView, setShowBankView] = useState(false);
  const [showBankEdit, setShowBankEdit] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: ''
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ===== Viewer role detection (admin check) =====
  // The pill must be visible ONLY to:
  //   - the profile owner (isOwner = true)
  //   - an admin viewing another user's profile
  // A regular signed-in viewer must never see it.
  const [viewerIsAdmin, setViewerIsAdmin] = useState(false);

  const isProfileOwner = Boolean(isOwner);
  const canViewBank = isProfileOwner || (viewerIsAdmin && !isProfileOwner);
  // Simpler form: canViewBank = isProfileOwner || viewerIsAdmin
  // (admin and owner are the only two permitted viewers)

  // Check if stats should be shown
  const shouldShowStats = () => {
    return profile?.vote_visibility === 'on';
  };

  // ===== Resolve whether the current viewer is an admin =====
  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setViewerIsAdmin(false);
          return;
        }
        const { data: row } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (mounted) setViewerIsAdmin(row?.role === 'admin');
      } catch (err) {
        console.error('Error checking admin role:', err);
        if (mounted) setViewerIsAdmin(false);
      }
    };

    checkAdmin();

    return () => { mounted = false; };
  }, []);

  // ===== Fetch bank details when modal opens =====
  useEffect(() => {
    if (showBankView && profile?.id) {
      fetchBankDetails();
    }
  }, [showBankView, profile?.id]);

  const fetchBankDetails = async () => {
    setBankLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_name, account_number, bank_name')
        .eq('id', profile.id)
        .maybeSingle();

      if (error) throw error;

      setBankDetails({
        account_name: data?.account_name || '',
        account_number: data?.account_number || '',
        bank_name: data?.bank_name || ''
      });
    } catch (err) {
      console.error('Error fetching bank details:', err);
    } finally {
      setBankLoading(false);
    }
  };

  // ===== Copy account number to clipboard =====
  const handleCopyAccountNumber = async () => {
    if (!bankDetails.account_number) return;
    try {
      await navigator.clipboard.writeText(bankDetails.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy account number:', err);
    }
  };

  // Fetch vote and gift counts
  const fetchStats = async () => {
    if (!profile?.id) return;
    
    // Only fetch stats if they should be shown
    if (!shouldShowStats()) {
      setVoteCount(0);
      setGiftCount(0);
      return;
    }
    
    setLoadingStats(true);
    try {
      // Fetch vote count - sum of votes from vote_transactions
      const { data: voteData, error: voteError } = await supabase
        .from('vote_transactions')
        .select('votes')
        .eq('candidate_id', profile.id)
        .eq('status', 'completed');

      if (voteError) throw voteError;

      // Calculate total votes
      const totalVotes = voteData?.reduce((sum, item) => sum + (item.votes || 0), 0) || 0;
      setVoteCount(totalVotes);

      // Fetch gift count - count of rows in gift_transactions
      const { data: giftData, error: giftError } = await supabase
        .from('gift_transactions')
        .select('*')
        .eq('candidate_id', profile.id)
        .eq('status', 'completed');

      if (giftError) throw giftError;

      // Calculate total gifts
      const totalGifts = giftData?.length || 0;
      setGiftCount(totalGifts);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch stats when profile changes or shouldShowStats changes
  useEffect(() => {
    if (profile?.id) {
      fetchStats();
    }
  }, [profile?.id, profile?.vote_visibility]);

  // If profile doesn't exist, don't render anything
  if (!profile) {
    return null;
  }

  // Handle banner upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBannerError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setBannerError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBannerError('Image must be less than 5MB');
      return;
    }

    setUploadingBanner(true);
    setBannerSuccess(false);

    try {
      // Use username for the file name - simpler path
      const username = profile.username || profile.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${username}.${fileExt}`;
      // Simple path - just the filename in the bucket root
      const filePath = fileName;

      // Upload to Supabase Storage - banner bucket
      const { data, error: uploadError } = await supabase.storage
        .from('banner')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Banner upload error:', uploadError);
        setBannerError(`Upload failed: ${uploadError.message}`);
        setUploadingBanner(false);
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banner')
        .getPublicUrl(filePath);

      // Update profile with banner URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          banner_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Banner update error:', updateError);
        setBannerError(`Update failed: ${updateError.message}`);
        setUploadingBanner(false);
        return;
      }

      setBannerSuccess(true);
      
      // Refresh profile data
      if (onUpdateProfile) {
        await onUpdateProfile();
      }

      // Reset success state after 3 seconds
      setTimeout(() => {
        setBannerSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Banner upload error:', error);
      setBannerError(`Error: ${error.message}`);
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  // Get banner URL with fallback
  const getBannerUrl = () => {
    // If profile has a banner_url, use it
    if (profile.banner_url) {
      return profile.banner_url;
    }
    // Fallback to default banner
    return 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200';
  };

  const bannerUrl = getBannerUrl();

  // Get status badge info (only for owner)
  const getStatusBadge = () => {
    const status = profile.account_status || 'pending_verification';
    
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          icon: <Check className="w-3 h-3" />,
          className: 'bg-green-500/20 border-green-500/30 text-green-400'
        };
      case 'pending_verification':
        return {
          label: 'Pending Review',
          icon: <Loader className="w-3 h-3 animate-spin" />,
          className: 'bg-[#C58B2A]/20 border-[#C58B2A]/30 text-[#C58B2A]'
        };
      case 'suspended':
        return {
          label: 'Suspended',
          icon: <AlertCircle className="w-3 h-3" />,
          className: 'bg-red-500/20 border-red-500/30 text-red-400'
        };
      default:
        return {
          label: 'Pending Review',
          icon: <Loader className="w-3 h-3 animate-spin" />,
          className: 'bg-[#C58B2A]/20 border-[#C58B2A]/30 text-[#C58B2A]'
        };
    }
  };

  const showStats = shouldShowStats();
  const hasBankDetails =
    bankDetails.account_name &&
    bankDetails.account_number &&
    bankDetails.bank_name;

  return (
    <>
      <div className="relative h-48 md:h-64 rounded-2xl mb-0 md:mb-0" style={{ zIndex: 1 }}>
        {/* Banner Image Container */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <Image
            src={bannerUrl}
            alt="Profile banner"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
            priority={true}
            onError={(e) => {
              // If image fails to load, fallback to default
              e.target.src = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Banner Upload Overlay */}
          {uploadingBanner && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-8 h-8 text-white animate-spin" />
                <span className="text-white text-sm font-medium">Uploading banner...</span>
              </div>
            </div>
          )}
          
          {/* Banner Success Overlay */}
          {bannerSuccess && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <Check className="w-10 h-10 text-green-400" />
                <span className="text-white text-sm font-medium">Banner updated!</span>
              </div>
            </div>
          )}

          {/* Banner Error Overlay */}
          {bannerError && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2 bg-black/50 p-4 rounded-lg">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <span className="text-white text-sm font-medium">{bannerError}</span>
                <button
                  onClick={() => setBannerError(null)}
                  className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs hover:bg-white/30 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Badge - Only visible to owner */}
        {isOwner && (
          <div className="absolute top-2 left-2 z-30">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border backdrop-blur-sm ${getStatusBadge().className}`}>
              <Shield className="w-3 h-3" />
              {getStatusBadge().icon}
              <span className="text-xs font-medium">{getStatusBadge().label}</span>
            </div>
          </div>
        )}

        {/* Edit Banner Button (Owner only) */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
            <label className="p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors cursor-pointer flex items-center gap-1 group">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              {uploadingBanner ? (
                <Loader className="w-4 h-4 text-white animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-white hidden md:inline">Change Banner</span>
                </>
              )}
            </label>
          </div>
        )}

        {/* Stats Container - Only show if shouldShowStats returns true */}
        <div className="absolute bottom-2 right-6 z-20 flex items-center gap-2">
          {showStats && (
            <>
              {/* Vote Count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                {loadingStats ? (
                  <Loader className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    <span className="text-white font-bold text-sm">{voteCount.toLocaleString()}</span>
                    <span className="text-white/60 text-xs hidden sm:inline">votes</span>
                  </>
                )}
              </div>

              {/* Gift Count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                {loadingStats ? (
                  <Loader className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-[#C58B2A]" />
                    <span className="text-white font-bold text-sm">{giftCount.toLocaleString()}</span>
                    <span className="text-white/60 text-xs hidden sm:inline">gifts</span>
                  </>
                )}
              </div>
            </>
          )}

          {/* ===== Bank Details pill — visible to owner OR admin ===== */}
          {canViewBank && (
            <button
              type="button"
              onClick={() => setShowBankView(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-[#C58B2A]/40 hover:border-[#C58B2A]/70 hover:bg-black/70 transition-all group"
              title={isProfileOwner ? 'View your bank details' : 'View bank details'}
            >
              <Wallet className="w-4 h-4 text-[#C58B2A] group-hover:scale-110 transition-transform" />
              <span className="text-white font-semibold text-xs">Bank</span>
            </button>
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-1 left-4 md:-bottom-2 md:left-6 z-30">
          <div className="relative">
            {/* Burnt lemon outline */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] p-1">
              <div className="w-full h-full rounded-full bg-black"></div>
            </div>
            
            {/* Profile image container */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-black overflow-hidden bg-gradient-to-br from-[#C58B2A] to-[#A96F1F]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  fill
                  sizes="(max-width: 768px) 80px, 112px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C58B2A] to-[#A96F1F]">
                  <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
              )}
              
              {/* Upload overlay */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
            </div>
            
            {/* Edit Photo Button */}
            {isOwner && !uploadingPhoto && (
              <label className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-burnt-orange-500 rounded-full flex items-center justify-center hover:bg-burnt-orange-600 transition-colors shadow-lg border-2 border-black z-50 cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="hidden"
                />
                <Camera className="w-3 h-3 md:w-4 md:h-4 text-white group-hover:scale-110 transition-transform" />
              </label>
            )}
            
            {/* Success checkmark */}
            {uploadSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-black z-50"
              >
                <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ===== View Bank Details Modal ===== */}
      <AnimatePresence>
        {showBankView && canViewBank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowBankView(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-[#C58B2A]/30 w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-[#C58B2A]/10 to-yellow-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C58B2A]/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#C58B2A]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {isProfileOwner ? 'Your Bank Details' : 'Bank Details'}
                    </h2>
                    <p className="text-xs text-white/40">
                      @{profile?.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBankView(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                {bankLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader className="w-6 h-6 text-[#C58B2A] animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Owner-only notice: what the bank details are used for */}
                    {isProfileOwner && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
                        <div className="flex items-start gap-2.5">
                          <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-amber-400">
                              Important Notice
                            </p>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                              These account details will be used to <span className="font-semibold text-white">disburse your gift earnings</span> to you. Please make sure the information is <span className="font-semibold text-white">100% accurate</span> and matches your bank account exactly. Incorrect details may result in failed or delayed payouts.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
                          <User className="w-3 h-3" />
                          Account Name
                        </div>
                        <p className="text-sm text-white font-medium break-all">
                          {bankDetails.account_name || '—'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
                          <Building2 className="w-3 h-3" />
                          Bank Name
                        </div>
                        <p className="text-sm text-white font-medium break-all">
                          {bankDetails.bank_name || '—'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
                            <CreditCard className="w-3 h-3" />
                            Account Number
                          </div>

                          {/* Copy button */}
                          {bankDetails.account_number && (
                            <button
                              type="button"
                              onClick={handleCopyAccountNumber}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                                copied
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                              }`}
                              title="Copy account number"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-white font-mono tracking-wider break-all">
                          {bankDetails.account_number || '—'}
                        </p>
                      </div>
                    </div>

                    {!hasBankDetails && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-xs text-amber-300">
                          {isProfileOwner
                            ? 'You have not added your bank details yet. Click Edit to add them.'
                            : 'This user has not added bank details yet.'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-2">
                <button
                  onClick={() => setShowBankView(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowBankView(false);
                    setShowBankEdit(true);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {hasBankDetails ? 'Edit' : 'Add Details'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Edit Bank Details (reuses the BankDetails modal) ===== */}
      {canViewBank && (
        <BankDetails
          profile={profile}
          isOpen={showBankEdit}
          onClose={() => setShowBankEdit(false)}
          onUpdate={() => {
            fetchBankDetails();
          }}
        />
      )}
    </>
  );
}