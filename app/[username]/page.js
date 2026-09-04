// app/[username]/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ChevronLeft,
  MoreHorizontal,
  User,
  Trophy,
  Settings,
  LogOut,
  MessageCircle,
  ThumbsUp,
  Eye,
  Heart,
  Grid,
  Video,
  Bookmark,
  Plus,
  Image as ImageIcon,
  Camera,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Award,
  Users,
  Crown,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Gift,
  Star
} from 'lucide-react';

// Import components
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileBanner from '../../components/profile/ProfileBanner';
import ProfileInfo from '../../components/profile/ProfileInfo';
import ProfileTabs from '../../components/profile/ProfileTabs';
import PostModal from '../../components/profile/PostModal';
import VideoModal from '../../components/profile/VideoModal';
import ShareModal from '../../components/profile/ShareModal';
import PostDetailModal from '../../components/profile/PostDetailModal';
import SettingsModal from '../../components/profile/SettingsModal';
import VoteModal from '../../components/profile/VoteModal';
import GiftModal from '../../components/profile/GiftModal';
import Status from '../../components/profile/Status';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  
  const [profile, setProfile] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Onboarding tips state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalViews: 0,
    totalLikes: 0,
    totalPosts: 0,
    rank: 0
  });

  const fetchProfileRef = useRef(false);
  const authCheckRef = useRef(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // =====================
  // STEP 1: ALWAYS LOAD PROFILE FIRST - No auth required!
  // =====================
  useEffect(() => {
    if (!fetchProfileRef.current) {
      fetchProfileRef.current = true;
      fetchProfile();
    }
  }, [username]);

  // =====================
  // STEP 2: Auth check is OPTIONAL - don't block profile view
  // =====================
  useEffect(() => {
    if (profile && !authCheckRef.current) {
      authCheckRef.current = true;
      checkCurrentUser();
    }
  }, [profile]);

  // =====================
  // Check if user has seen onboarding
  // =====================
  useEffect(() => {
    if (isOwner && profile) {
      // Check if user has already seen onboarding
      const hasSeen = localStorage.getItem(`whowin_onboarding_${profile.id}`);
      if (hasSeen) {
        setHasSeenOnboarding(true);
        setShowOnboarding(false);
      } else {
        // Show onboarding after a small delay
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1500);
      }
    }
  }, [isOwner, profile]);

  // =====================
  // FETCH PROFILE - ALWAYS WORKS
  // =====================
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (profileData.vote_control === undefined || profileData.vote_control === null) {
        profileData.vote_control = false;
      }
      
      if (!profileData.image_url || !Array.isArray(profileData.image_url)) {
        profileData.image_url = [];
      }
      
      setProfile(profileData);

      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
      }

      const videoPosts = (videos || []).map(video => ({
        id: video.id,
        type: 'video',
        media: [{
          url: video.url,
          embedUrl: video.embed_url || video.url,
          provider: video.provider || 'youtube'
        }],
        caption: video.caption || '',
        created_at: video.created_at,
        likes: 0,
        comments: 0,
        _fromTable: 'videos'
      }));

      const images = profileData.image_url || [];
      const combinedPosts = [...images, ...videoPosts].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setAllPosts(combinedPosts);
      setStats(prev => ({ ...prev, totalPosts: combinedPosts.length }));

      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      setFollowers(followersCount || 0);

      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowing(followingCount || 0);

      const { data: voteData, error: voteError } = await supabase
        .from('vote_transactions')
        .select('votes')
        .eq('candidate_id', profileData.id)
        .eq('status', 'completed');

      if (voteError) {
        console.error('Error fetching votes:', voteError);
      }

      const totalVotes = voteData?.reduce((sum, tx) => sum + (tx.votes || 0), 0) || 0;
      const rank = Math.floor(Math.random() * 100) + 1;
      
      setStats({
        totalVotes: totalVotes,
        totalViews: Math.floor(Math.random() * 100000) + 10000,
        totalLikes: Math.floor(Math.random() * 50000) + 5000,
        totalPosts: combinedPosts.length,
        rank: rank
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.name !== 'AbortError') {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // CHECK AUTH - OPTIONAL, NON-BLOCKING
  // =====================
  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setAuthChecked(true);
      
      if (userError || !user) {
        console.log('Viewing as guest');
        setIsOwner(false);
        setCurrentUser(null);
        setIsFollowing(false);
        return;
      }

      setCurrentUser(user);
      
      if (user && profile) {
        const isProfileOwner = user.id === profile.id;
        setIsOwner(isProfileOwner);

        if (!isProfileOwner) {
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', profile.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        } else {
          setIsFollowing(false);
        }
      } else {
        setIsOwner(false);
        setIsFollowing(false);
      }
    } catch (error) {
      console.log('Auth check failed - viewing as guest');
      setIsOwner(false);
      setCurrentUser(null);
      setIsFollowing(false);
      setAuthChecked(true);
    }
  };

  // =====================
  // REMAINING HANDLERS
  // =====================

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        setFollowers(prev => prev - 1);
      } else {
        await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          });
        setFollowers(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile) return;

    setUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatar_url: reader.result
        }));
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
      setShowPhotoPopup(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      fetchProfile();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleImagePost = async (files, caption) => {
    if (!files.length || !profile) {
      console.error('No files or profile');
      return;
    }

    console.log('Uploading images:', files.length);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/posts/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        return { url: publicUrl };
      });

      const mediaUrls = await Promise.all(uploadPromises);

      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        media: mediaUrls,
        caption: caption || '',
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0
      };

      const currentPosts = profile.image_url || [];
      const updatedPosts = [newPost, ...currentPosts];

      const { error } = await supabase
        .from('profiles')
        .update({ 
          image_url: updatedPosts,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Post added successfully');

      setProfile(prev => ({ ...prev, image_url: updatedPosts }));
      setAllPosts(prev => [newPost, ...prev]);
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
      setShowPostModal(false);
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Failed to upload post. Please try again.');
    }
  };

  const handleDeletePost = async (post) => {
    if (!profile || !isOwner) return;

    try {
      if (post._fromTable === 'videos') {
        console.log('🗑️ Deleting video:', post.id);
        
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', post.id);

        if (error) throw error;
        
        setAllPosts(prev => prev.filter(p => p.id !== post.id));
        setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
        setSelectedPost(null);
        return;
      }

      if (post.type === 'image') {
        const updatedPosts = (profile.image_url || []).filter(p => p.id !== post.id);
        await supabase
          .from('profiles')
          .update({ 
            image_url: updatedPosts,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        setProfile(prev => ({ ...prev, image_url: updatedPosts }));
      }

      setAllPosts(prev => prev.filter(p => p.id !== post.id));
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = async (postId, newCaption) => {
    if (!profile || !isOwner) return;

    try {
      const post = allPosts.find(p => p.id === postId);
      
      if (post?._fromTable === 'videos') {
        const { error } = await supabase
          .from('videos')
          .update({ caption: newCaption })
          .eq('id', postId);

        if (error) throw error;
        
        setAllPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, caption: newCaption } : p
        ));
        setSelectedPost(null);
        return;
      }

      let updatedPosts;
      if (post.type === 'image') {
        updatedPosts = (profile.image_url || []).map(p => 
          p.id === postId ? { ...p, caption: newCaption } : p
        );
        await supabase
          .from('profiles')
          .update({ 
            image_url: updatedPosts,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        setProfile(prev => ({ ...prev, image_url: updatedPosts }));
      }

      setAllPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, caption: newCaption } : p
      ));
      setSelectedPost(null);
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleSavePost = async (post) => {
    if (!currentUser || !profile) return;

    try {
      const currentSaved = profile.saved_post || [];
      const isSaved = currentSaved.some(p => p.id === post.id);
      
      let updatedSaved;
      if (isSaved) {
        updatedSaved = currentSaved.filter(p => p.id !== post.id);
      } else {
        updatedSaved = [post, ...currentSaved];
      }

      await supabase
        .from('profiles')
        .update({ 
          saved_post: updatedSaved,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (isOwner) {
        setProfile(prev => ({ ...prev, saved_post: updatedSaved }));
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleVoteSuccess = async (voteCount, amount) => {
    console.log(`Voted ${voteCount} times for $${amount}`);
    
    try {
      const { data: voteData, error: voteError } = await supabase
        .from('vote_transactions')
        .select('votes')
        .eq('candidate_id', profile.id)
        .eq('status', 'completed');

      if (voteError) {
        console.error('Error refreshing votes:', voteError);
        return;
      }

      const totalVotes = voteData?.reduce((sum, tx) => sum + (tx.votes || 0), 0) || 0;
      
      setStats(prev => ({
        ...prev,
        totalVotes: totalVotes
      }));
    } catch (error) {
      console.error('Error refreshing vote count:', error);
    }
  };

  const getEmbedUrl = (url) => {
    if (url.includes('youtu.be') || url.includes('youtube.com')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0] || 
                     url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url;
  };

  const shouldRenderProfileHeader = () => {
    if (!profile) return false;
    if (!isOwner) return true;
    const status = profile.account_status;
    return status !== 'pending_verification' && status !== 'suspended';
  };

  const handleOpenVoteModal = () => {
    setShowVoteModal(true);
  };

  // =====================
  // ONBOARDING HANDLERS
  // =====================

  const onboardingSteps = [
    {
      title: 'Perfect Your Registration ✨',
      description: 'To perfect your registration, these are the things you must do next.',
      tips: [
        'Complete each step carefully',
        'Show voters the best version of you'
      ]
    },
    {
      title: 'Great First Impression! 📸',
      description: 'Your profile photo is the first thing people see. Make it clear and attractive.',
      image: '/passport1.jpeg',
      imageAlt: 'Example profile photo',
      tips: [
        'Use a clear, well-lit photo',
        'Face should be clearly visible',
        'Smile and look approachable'
      ]
    },
    {
      title: 'Build Your Gallery 🖼️',
      description: 'Upload quality images to help voters connect with you.',
      images: ['/image1.jpeg', '/image2.jpeg'],
      tips: [
        'Show your personality',
        'Clear and high-quality images'
      ]
    },
    {
      title: 'Create Your Video Monologue 🎬',
      description: 'Make a less than 60 second video monologue that instantly captures your audience.',
      action: 'video',
      tips: [
        'Dance, act, sing, or create any content that captures attention',
        'Click Upload Video on your profile page to add it',
        'This step is crucial to your registration'
      ]
    },
    {
      title: 'Complete Your Profile ✨',
      description: 'Click the Settings icon ⚙️ and add your "About Me" section.',
      action: 'settings',
      tips: [
        'Tell your story authentically',
        'Be genuine and relatable'
      ]
    },
    {
      title: 'Connect Social Media 🌐',
      description: 'Add your social links in Settings to grow your following.',
      socialIcons: [Instagram, Twitter, Youtube, Facebook, Linkedin],
      tips: [
        'Link all your active social accounts',
        'Engage with your followers'
      ]
    },
    {
      title: "You're Ready to Shine! ⭐",
      description: "You're all set! We wish you the best of luck in the competition!",
      isFinal: true,
      tips: [
        'Share your journey on socials',
        'Be yourself and have fun!'
      ]
    }
  ];

  useEffect(() => {
    const galleryImages = onboardingSteps[onboardingStep]?.images;
    if (!showOnboarding || !galleryImages) return;

    const interval = setInterval(() => {
      setGalleryImageIndex(prev => (prev + 1) % galleryImages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [showOnboarding, onboardingStep]);

  const handleNextOnboarding = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(prev => prev + 1);
    }
  };

  const handlePreviousOnboarding = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(prev => prev - 1);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    if (profile?.id) {
      localStorage.setItem(`whowin_onboarding_${profile.id}`, 'true');
    }
  };

  const handleOnboardingAction = (action) => {
    if (action === 'settings' || action === 'video') {
      setShowOnboarding(false);
      setHasSeenOnboarding(true);
      if (profile?.id) {
        localStorage.setItem(`whowin_onboarding_${profile.id}`, 'true');
      }
      if (action === 'settings') {
        setShowSettings(true);
      } else {
        setShowVideoModal(true);
      }
    }
  };

  const handleOpenOnboarding = () => {
    setOnboardingStep(0);
    setGalleryImageIndex(0);
    setShowOnboarding(true);
  };

  // =====================
  // RENDER
  // =====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/70 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-white/60 text-sm mb-6">
            The user @{username} doesn't exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const savedPosts = profile.saved_post || [];
  const displayPosts = activeTab === 'saved' ? savedPosts : allPosts;

  const isFinalStep = onboardingStep === onboardingSteps.length - 1;
  const currentStep = onboardingSteps[onboardingStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        <ProfileBanner
          profile={profile}
          isOwner={isOwner}
          uploadingPhoto={uploadingPhoto}
          uploadSuccess={uploadSuccess}
          onPhotoUpload={handlePhotoUpload}
          onSettingsClick={() => setShowSettings(true)}
          onVoteClick={handleOpenVoteModal}
          isVoteModalOpen={showVoteModal}
          onUpdateProfile={fetchProfile}
        />

        <ProfileInfo
          profile={profile}
          isOwner={isOwner}
          isFollowing={isFollowing}
          followers={followers}
          following={following}
          stats={stats}
          onFollow={handleFollow}
          onMessage={() => {}}
        />

        {shouldRenderProfileHeader() && (
          <div className="mt-4">
            <ProfileHeader
              stats={stats}
              isOwner={isOwner}
              onSettingsClick={() => setShowSettings(true)}
              profile={profile}
              onGiftClick={() => setShowGiftModal(true)}
              onVoteClick={handleOpenVoteModal}
              onShareClick={() => setShowShareModal(true)}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              postCount={allPosts.length}
              videoCount={allPosts.filter(p => p.type === 'video').length}
              posts={displayPosts}
              isOwner={isOwner}
              onPostClick={setSelectedPost}
              onAddPhoto={() => setShowPostModal(true)}
              onAddVideo={() => setShowVideoModal(true)}
              onSettingsClick={() => setShowSettings(true)}
              profile={profile}
            />
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={handleOpenOnboarding}
              className="inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Tips
            </button>
          )}
        </div>
      </div>

      {/* Status Modal - Only for owner */}
      <Status
        profile={profile}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />

      {/* Modals */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            profile={profile}
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onUpdate={fetchProfile}
            supabase={supabase}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPostModal && (
          <PostModal
            onClose={() => setShowPostModal(false)}
            onUpload={handleImagePost}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            profile={profile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGiftModal && (
          <GiftModal
            isOpen={showGiftModal}
            onClose={() => setShowGiftModal(false)}
            profile={profile}
            onGiftSuccess={(gift, amount) => {
              console.log(`🎁 ${gift.emoji} ${gift.name} gift sent for ${amount}`);
              fetchProfile();
            }}
            onGiftError={(error) => {
              console.error('Gift error:', error);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoModal && (
          <VideoModal
            onClose={() => setShowVideoModal(false)}
            profileId={profile?.id}
            onVideoAdded={(newVideo) => {
              const newPost = {
                id: newVideo.id,
                type: 'video',
                media: [{
                  url: newVideo.url,
                  embedUrl: newVideo.embed_url,
                  provider: newVideo.provider || 'youtube'
                }],
                caption: newVideo.caption || '',
                created_at: newVideo.created_at,
                likes: 0,
                comments: 0,
                _fromTable: 'videos'
              };
              setAllPosts(prev => [newPost, ...prev]);
              setStats(prev => ({ 
                ...prev, 
                totalPosts: prev.totalPosts + 1 
              }));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoteModal && (
          <VoteModal
            isOpen={showVoteModal}
            onClose={() => setShowVoteModal(false)}
            profile={profile}
            onVoteSuccess={handleVoteSuccess}
            onVoteError={(error) => console.error('Vote error:', error)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            profile={profile}
            isOwner={isOwner}
            onClose={() => setSelectedPost(null)}
            onDelete={() => handleDeletePost(selectedPost)}
            onEdit={(caption) => handleEditPost(selectedPost.id, caption)}
            onSave={() => handleSavePost(selectedPost)}
            getEmbedUrl={getEmbedUrl}
            allPosts={allPosts}
            initialIndex={allPosts.findIndex(p => p.id === selectedPost.id)}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Tips Modal - Clean & Compact */}
      <AnimatePresence>
        {showOnboarding && isOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative bg-gradient-to-br from-gray-900 to-black border border-yellow-400/20 rounded-xl p-5 max-w-sm w-full shadow-2xl shadow-yellow-400/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar - thinner */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 rounded-t-xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  initial={{ width: `${((onboardingStep) / (onboardingSteps.length - 1)) * 100}%` }}
                  animate={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Close button - smaller */}
              <button
                onClick={handleCloseOnboarding}
                className="absolute top-2 right-2 text-white/30 hover:text-white/60 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step indicator - compact */}
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-[10px] text-white/30">
                  {onboardingStep + 1}/{onboardingSteps.length}
                </span>
                <div className="flex gap-1">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${
                        index === onboardingStep
                          ? 'w-4 bg-yellow-400'
                          : index < onboardingStep
                          ? 'w-1 bg-yellow-400/30'
                          : 'w-1 bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content - compact */}
              <div className="space-y-2.5">
                {/* Title - smaller */}
                <h2 className="text-base font-bold text-white">
                  {currentStep.title}
                </h2>

                {/* Images - smaller */}
                {currentStep.image && (
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border border-yellow-400/20 shadow-lg shadow-yellow-400/10">
                    <Image
                      src={currentStep.image}
                      alt={currentStep.imageAlt || 'Example'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {currentStep.images && (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 mx-auto rounded-md overflow-hidden border border-white/5">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={galleryImageIndex}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={currentStep.images[galleryImageIndex]}
                            alt={`Example ${galleryImageIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {currentStep.images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Show gallery example ${index + 1}`}
                          onClick={() => setGalleryImageIndex(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === galleryImageIndex ? 'w-4 bg-yellow-400' : 'w-1.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Social icons - smaller */}
                {currentStep.socialIcons && (
                  <div className="flex justify-center gap-2">
                    {currentStep.socialIcons.map((Icon, idx) => (
                      <div key={idx} className="w-7 h-7 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Icon className="w-3.5 h-3.5 text-white/40" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Description - smaller */}
                <p className="text-xs font-medium text-white/60 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Tips - smaller */}
                <div className="space-y-1">
                  {currentStep.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs font-medium text-white/50">
                      <Check className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px]">{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons - compact */}
                <div className="flex gap-2 pt-1.5">
                    {isFinalStep ? (
                    <>
                      <button
                        onClick={() => handleOnboardingAction('settings')}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Setup Now
                      </button>
                      <button
                        onClick={handleCloseOnboarding}
                        className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                      >
                        Later
                      </button>
                    </>
                  ) : currentStep.action ? (
                    <>
                      <button
                        onClick={() => handleOnboardingAction(currentStep.action)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                      >
                        {currentStep.action === 'video' ? 'Upload Video' : 'Open Settings'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleNextOnboarding}
                        className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                      >
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNextOnboarding}
                      className="w-full px-3 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Previous button - smaller */}
                {onboardingStep > 0 && !isFinalStep && (
                  <button
                    onClick={handlePreviousOnboarding}
                    className="w-full text-[10px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>

              {/* Decorative sparkles - smaller */}
              <div className="absolute -top-1 -right-1 opacity-10">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="absolute -bottom-1 -left-1 opacity-10">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}