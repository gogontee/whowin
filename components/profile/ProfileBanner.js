// /components/profile/ProfileBanner.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Loader, Check, X, AlertCircle, Heart, Edit3, Upload, Gift, Award, Shield } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfileBanner({ 
  profile, 
  isOwner, 
  uploadingPhoto, 
  uploadSuccess,
  showPhotoPopup,
  onPhotoUpload,
  onClosePopup,
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check if stats should be shown
  const shouldShowStats = () => {
    // If owner, always show stats
    if (isOwner) return true;
    
    // If not owner, only show stats if vote_control is true
    const voteControl = profile?.vote_control ?? false;
    return voteControl === true;
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
  }, [profile?.id, isOwner, profile?.vote_control]);

  // Debug logging
  useEffect(() => {
    console.log('ProfileBanner mounted');
    console.log('isOwner:', isOwner);
    console.log('profile exists:', !!profile);
    console.log('profile.banner_url:', profile?.banner_url);
    console.log('profile.account_status:', profile?.account_status);
    console.log('profile.vote_control:', profile?.vote_control);
    console.log('voteCount:', voteCount);
    console.log('giftCount:', giftCount);
    console.log('shouldShowStats:', shouldShowStats());
  }, [isOwner, profile, voteCount, giftCount]);

  // If profile doesn't exist, don't render anything
  if (!profile) {
    console.log('ProfileBanner: no profile data');
    return null;
  }

  // Handle banner upload - FIXED VERSION
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

      console.log('Uploading banner to bucket: banner');
      console.log('File path:', filePath);
      console.log('Username:', username);

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

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banner')
        .getPublicUrl(filePath);

      console.log('Banner public URL:', publicUrl);

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
          className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
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
          className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
        };
    }
  };

  const status = profile.account_status || 'pending_verification';
  const showStats = shouldShowStats();

  return (
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
            console.log('Banner image failed to load, using fallback');
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
      {showStats && (
        <div className="absolute bottom-2 right-6 z-20 flex items-center gap-3">
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
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{giftCount.toLocaleString()}</span>
                <span className="text-white/60 text-xs hidden sm:inline">gifts</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile Picture */}
      <div className="absolute -bottom-1 left-4 md:-bottom-2 md:left-6 z-30">
        <div className="relative">
          {/* Burnt lemon outline */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 p-1">
            <div className="w-full h-full rounded-full bg-black"></div>
          </div>
          
          {/* Profile image container */}
          <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-black overflow-hidden bg-gradient-to-br from-burnt-orange-500 to-yellow-500">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                fill
                sizes="(max-width: 768px) 80px, 112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-burnt-orange-500 to-yellow-500">
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

      {/* Photo Upload Popup */}
      <AnimatePresence>
        {showPhotoPopup && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-24 md:left-32 bottom-2 z-[250]"
          >
            <div className="relative bg-gradient-to-r from-burnt-orange-600 to-yellow-500 rounded-xl shadow-2xl p-3 max-w-xs">
              <div className="absolute -left-2 top-6 w-4 h-4 bg-burnt-orange-600 rotate-45 transform origin-center"></div>
              
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-xs mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Complete Your Profile
                  </h3>
                  <p className="text-white/90 text-[10px] mb-2">
                    Add a profile photo to help others recognize you!
                  </p>
                  <div className="flex gap-2">
                    <label className="px-2 py-1 bg-white text-burnt-orange-600 rounded-lg text-[10px] font-semibold hover:bg-white/90 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onPhotoUpload}
                        className="hidden"
                      />
                      Upload
                    </label>
                    <button
                      onClick={onClosePopup}
                      className="px-2 py-1 bg-white/20 text-white rounded-lg text-[10px] font-semibold hover:bg-white/30 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
                <button
                  onClick={onClosePopup}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}