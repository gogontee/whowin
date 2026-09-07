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
  Send,
  Gift,
  Star,
  Upload,
  Film,
  Link2,
  CheckCircle
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
import AboutMeModal from '../../components/profile/AboutMeModal';
import SocialLinksModal from '../../components/profile/SocialLinksModal';

const countProfileImages = (imagePosts) => (Array.isArray(imagePosts) ? imagePosts : []).reduce(
  (count, post) => count + (Array.isArray(post?.media) ? post.media.length : 1),
  0
);

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
  const [showAboutMeModal, setShowAboutMeModal] = useState(false);
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);
  
  // Onboarding tips state - Progressive
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [photoExampleIndex, setPhotoExampleIndex] = useState(0);
  const [completionStatus, setCompletionStatus] = useState({
    images: false,
    video: false,
    bio: false,
    telegram: false
  });
  
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalViews: 0,
    totalLikes: 0,
    totalPosts: 0,
    rank: 0
  });

  const fetchProfileRef = useRef(false);
  const authCheckRef = useRef(false);
  const silentRefreshTimerRef = useRef(null);
  const isCheckingOnboardingRef = useRef(false);
  const onboardingActionRef = useRef(false);
  const onboardingCompletionPendingRef = useRef(false);
  const completionPopupShownRef = useRef(false);

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
  // SILENT REFRESH - Check for profile updates without reloading the page
  // =====================
  useEffect(() => {
    if (!isOwner || !profile) return;

    if (silentRefreshTimerRef.current) {
      clearInterval(silentRefreshTimerRef.current);
    }

    silentRefreshTimerRef.current = setInterval(() => {
      silentRefreshProfile();
    }, 3000);

    return () => {
      if (silentRefreshTimerRef.current) {
        clearInterval(silentRefreshTimerRef.current);
      }
    };
  }, [isOwner, profile]);

  // =====================
  // SILENT REFRESH FUNCTION - Fetches profile without reloading the page
  // =====================
  const silentRefreshProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle();

      if (error || !profileData) return;

      const hasChanged = 
        JSON.stringify(profileData.image_url) !== JSON.stringify(profile.image_url) ||
        JSON.stringify(profileData.video_url) !== JSON.stringify(profile.video_url) ||
        profileData.bio !== profile.bio ||
        profileData.telegram !== profile.telegram;

      if (hasChanged) {
        setProfile(profileData);
        
        // Check if there are any image posts (array of post objects)
        const hasTwoImages = countProfileImages(profileData.image_url) >= 2;
        const hasVideo = Array.isArray(profileData.video_url) && profileData.video_url.length > 0;
        const hasBio = profileData.bio && profileData.bio.trim().length > 0;
        const hasTelegram = profileData.telegram && profileData.telegram.trim().length > 0;

        const newStatus = {
          images: hasTwoImages,
          video: hasVideo,
          bio: hasBio,
          telegram: hasTelegram
        };

        setCompletionStatus(newStatus);

        // Update posts - image_url now contains post objects
        const imagePosts = (profileData.image_url || []).map((post) => ({
          ...post,
          type: 'image'
        }));

        // video_url now contains post objects
        const videoPosts = (profileData.video_url || []).map((post) => ({
          ...post,
          type: 'video'
        }));

        const combinedPosts = [...imagePosts, ...videoPosts].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setAllPosts(combinedPosts);
        setStats(prev => ({ ...prev, totalPosts: combinedPosts.length }));

        checkAndTriggerOnboarding(profileData, newStatus);
      }
    } catch (error) {
      console.log('Silent refresh failed:', error.message);
    }
  };

  // =====================
  // CHECK AND TRIGGER ONBOARDING
  // =====================
  const checkAndTriggerOnboarding = (profileData, status) => {
    if (isCheckingOnboardingRef.current) return;
    isCheckingOnboardingRef.current = true;

    try {
      const hasTwoImages = status ? status.images : countProfileImages(profileData.image_url) >= 2;
      const hasVideo = status ? status.video : (Array.isArray(profileData.video_url) && profileData.video_url.length > 0);
      const hasBio = status ? status.bio : Boolean(profileData.bio?.trim());
      const hasTelegram = status ? status.telegram : Boolean(profileData.telegram?.trim());

      const currentStatus = {
        images: hasTwoImages,
        video: hasVideo,
        bio: hasBio,
        telegram: hasTelegram
      };

      const allCompleted = currentStatus.images && currentStatus.video && currentStatus.bio && currentStatus.telegram;

      // Check if this is a first-time user (no images, no video, no bio, no telegram)
      const isFirstTimeUser = !currentStatus.images && !currentStatus.video && !currentStatus.bio && !currentStatus.telegram;

      // Check if user has seen the welcome steps
      const hasSeenWelcome = localStorage.getItem(`whowin_welcome_seen_${profileData.id}`);

      let nextStep = -1;

      if (allCompleted) {
        // All steps completed
        if (onboardingCompletionPendingRef.current) {
          onboardingCompletionPendingRef.current = false;
          completionPopupShownRef.current = true;
          nextStep = onboardingSteps.length - 1;
        } else if (!completionPopupShownRef.current) {
          setShowOnboarding(false);
          isCheckingOnboardingRef.current = false;
          return;
        }
      } else if (isFirstTimeUser && !hasSeenWelcome) {
        // First-time user - show welcome steps (Step 0 and Step 1)
        nextStep = 0;
      } else if (!currentStatus.images) {
        // User has seen welcome but hasn't uploaded photos
        nextStep = 2;
      } else if (!currentStatus.video) {
        nextStep = 3;
      } else if (!currentStatus.bio) {
        nextStep = 4;
      } else if (!currentStatus.telegram) {
        nextStep = 5;
      }

      if (nextStep !== -1) {
        setOnboardingStep(nextStep);
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } finally {
      isCheckingOnboardingRef.current = false;
    }
  };

  // =====================
  // Auto-rotate photo examples
  // =====================
  useEffect(() => {
    if (!showOnboarding) return;
    const photoExamples = ['/passport1.jpeg', '/passport2.jpg'];
    
    const interval = setInterval(() => {
      setPhotoExampleIndex(prev => (prev + 1) % photoExamples.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [showOnboarding]);

  // =====================
  // Auto-rotate gallery images
  // =====================
  useEffect(() => {
    const galleryImages = onboardingSteps[onboardingStep]?.images;
    if (!showOnboarding || !galleryImages) return;

    const interval = setInterval(() => {
      setGalleryImageIndex(prev => (prev + 1) % galleryImages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [showOnboarding, onboardingStep]);

  // =====================
  // Check completion status and trigger progressive onboarding
  // =====================
  useEffect(() => {
    if (!isOwner || !profile || loading) return;

    const hasTwoImages = countProfileImages(profile.image_url) >= 2;
    const hasVideo = Array.isArray(profile.video_url) && profile.video_url.length > 0;
    const hasBio = Boolean(profile.bio?.trim());
    const hasTelegram = Boolean(profile.telegram?.trim());

    const status = {
      images: hasTwoImages,
      video: hasVideo,
      bio: hasBio,
      telegram: hasTelegram
    };

    setCompletionStatus(status);

    const allCompleted = status.images && status.video && status.bio && status.telegram;
    const isFirstTimeUser = !status.images && !status.video && !status.bio && !status.telegram;
    const hasSeenWelcome = localStorage.getItem(`whowin_welcome_seen_${profile.id}`);

    let nextStep = -1;

    if (allCompleted) {
      if (onboardingCompletionPendingRef.current) {
        onboardingCompletionPendingRef.current = false;
        completionPopupShownRef.current = true;
        nextStep = onboardingSteps.length - 1;
      } else if (!completionPopupShownRef.current) {
        setShowOnboarding(false);
        return;
      }
    } else if (isFirstTimeUser && !hasSeenWelcome) {
      // First-time user - show welcome steps
      nextStep = 0;
    } else if (!status.images) {
      nextStep = 2;
    } else if (!status.video) {
      nextStep = 3;
    } else if (!status.bio) {
      nextStep = 4;
    } else if (!status.telegram) {
      nextStep = 5;
    }

    if (nextStep !== -1) {
      setOnboardingStep(nextStep);
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [isOwner, profile, loading]);

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
      
      if (!profileData.video_url || !Array.isArray(profileData.video_url)) {
        profileData.video_url = [];
      }
      
      setProfile(profileData);

      // image_url now contains post objects with type 'image'
      const imagePosts = (profileData.image_url || []).map((post) => ({
        ...post,
        type: 'image'
      }));

      // video_url now contains post objects with type 'video'
      const videoPosts = (profileData.video_url || []).map((post) => ({
        ...post,
        type: 'video'
      }));

      // Combine all posts and sort by created_at
      const combinedPosts = [...imagePosts, ...videoPosts].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setAllPosts(combinedPosts);
      setStats(prev => ({ ...prev, totalPosts: combinedPosts.length }));

      // Also fetch videos from videos table (for backward compatibility)
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (!videosError && videos) {
        const videoTablePosts = videos.map(video => ({
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
        
        const allPostsCombined = [...combinedPosts, ...videoTablePosts].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setAllPosts(allPostsCombined);
        setStats(prev => ({ ...prev, totalPosts: allPostsCombined.length }));
      }

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

  const handleImagePost = async (files) => {
    if (!files.length || !profile) {
      console.error('No files or profile');
      return;
    }

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

      // Create a SINGLE post object with multiple images in media array
      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        media: mediaUrls,
        caption: '',
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0
      };

      const existingImages = profile.image_url || [];
      const updatedImages = [newPost, ...existingImages];

      const { error } = await supabase
        .from('profiles')
        .update({ 
          image_url: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      setProfile(prev => ({ ...prev, image_url: updatedImages }));
      setAllPosts(prev => [newPost, ...prev]);
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
      if (onboardingActionRef.current) {
        onboardingActionRef.current = false;
        onboardingCompletionPendingRef.current = true;
      }
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
        const updatedImages = (profile.image_url || []).filter(p => p.id !== post.id);
        
        await supabase
          .from('profiles')
          .update({ 
            image_url: updatedImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        setProfile(prev => ({ ...prev, image_url: updatedImages }));
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

      // Update the post in the image_url array
      const updatedImages = (profile.image_url || []).map(p => 
        p.id === postId ? { ...p, caption: newCaption } : p
      );

      await supabase
        .from('profiles')
        .update({ 
          image_url: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      setProfile(prev => ({ ...prev, image_url: updatedImages }));
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
  // PROGRESSIVE ONBOARDING HANDLERS
  // =====================

  const onboardingSteps = [
    {
      title: 'Next Step ✨',
      description: 'You will be required to upload an audition video, and two clear studio standard full image photos of yourself.',
      tips: [
        'Complete each step carefully',
        'Show the best version of you'
      ]
    },
    {
      title: 'Profile Photo 📸',
      description: 'Your profile photo is the first thing we notice. Make it clear and attractive.',
      images: ['/passport1.jpeg', '/passport2.jpg'],
      tips: [
        'Use a clear, well-lit photo',
        'Face should be clearly visible'
      ]
    },
    {
      title: 'Upload Your Photos 📸',
      description: 'Kindly upload 2 full clear pictures of yourself. (Only studio standard pictures are acceptable).',
      images: ['/image1.jpeg', '/image2.jpeg'],
      action: 'upload_photos',
      tips: [
        'NOTE: This will determine the consideration for your participation, it is compulsory.',
        'Upload clear, well-lit photos',
        'Studio standard pictures only'
      ]
    },
    {
      title: 'Audition Video Needed 🎬',
      description: 'Make a video of yourself with a phone not more than 50 seconds on how you can make viewers have fun watching you on TV and on Phone screens. In the video you can TALK or DANCE or ACT or express yourself in anyway possible to convince our panel of screening.',
      action: 'upload_video',
      tips: [
        'Video must be 50 seconds or less',
        'Show your personality',
        'Be creative and entertaining'
      ]
    },
    {
      title: 'Tell Us About Yourself ✨',
      description: 'Click below to tell us more about yourself. Share your story, background, and what makes you unique.',
      action: 'about_me',
      tips: [
        'Share your journey and passion',
        'Be authentic and genuine'
      ]
    },
    {
      title: 'Connect Your Social Media 🌐',
      description: 'Add your social media links. Telegram is required for verification purposes.',
      action: 'social_links',
      tips: [
        'Telegram is required',
        'Link all your active social accounts'
      ]
    },
    {
      title: "🎉 Congratulations! You're Ready to Shine! ⭐",
      description: "You've successfully completed all required steps! Our team will review your application and get back to you soon.",
      isFinal: true,
      tips: [
        'Be yourself and have fun!',
        'Wishing you the best of luck!'
      ]
    }
  ];

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
      localStorage.setItem(`whowin_welcome_seen_${profile.id}`, 'true');
    }
    const sessionReminderKey = `whowin_onboarding_reminder_${profile?.id}`;
    sessionStorage.removeItem(sessionReminderKey);
  };

  const handleFinalStepComplete = () => {
    setShowOnboarding(false);
    completionPopupShownRef.current = false;
    setHasSeenOnboarding(true);
    if (profile?.id) {
      localStorage.setItem(`whowin_onboarding_${profile.id}`, 'true');
      localStorage.setItem(`whowin_welcome_seen_${profile.id}`, 'true');
      localStorage.setItem(`whowin_success_seen_${profile.id}`, 'true');
    }
    const sessionReminderKey = `whowin_onboarding_reminder_${profile?.id}`;
    sessionStorage.removeItem(sessionReminderKey);
  };

  const handleOnboardingAction = (action) => {
    setShowOnboarding(false);
    onboardingActionRef.current = true;
    
    if (profile?.id) {
      localStorage.setItem(`whowin_onboarding_${profile.id}`, 'true');
      localStorage.setItem(`whowin_welcome_seen_${profile.id}`, 'true');
    }
    
    switch (action) {
      case 'upload_photos':
        setShowPostModal(true);
        break;
      case 'upload_video':
        setShowVideoModal(true);
        break;
      case 'about_me':
        setShowAboutMeModal(true);
        break;
      case 'social_links':
        setShowSocialLinksModal(true);
        break;
      default:
        break;
    }
  };

  const handleOpenOnboarding = () => {
    let step = 0;
    if (completionStatus.images) step = 3;
    if (completionStatus.images && completionStatus.video) step = 4;
    if (completionStatus.images && completionStatus.video && completionStatus.bio) step = 5;
    if (completionStatus.images && completionStatus.video && completionStatus.bio && completionStatus.telegram) {
      step = onboardingSteps.length - 1;
    }
    setOnboardingStep(step);
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
            className="w-12 h-12 border-4 border-[#C58B2A] border-t-transparent rounded-full mx-auto mb-4"
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
          <div className="w-24 h-24 bg-[#C58B2A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-[#C58B2A]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-white/60 text-sm mb-6">
            The user @{username} doesn't exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
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

  const allStepsCompleted = completionStatus.images && completionStatus.video && completionStatus.bio && completionStatus.telegram;

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
          {isOwner && !allStepsCompleted && (
            <button
              type="button"
              onClick={handleOpenOnboarding}
              className="inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 bg-[#C58B2A]/20 hover:bg-[#C58B2A]/30 border border-[#C58B2A]/30 rounded-lg text-xs text-[#C58B2A] hover:text-[#D4AF37] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Complete Steps
            </button>
          )}
          {isOwner && allStepsCompleted && (
            <button
              type="button"
              className="inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Complete
            </button>
          )}
        </div>
      </div>

      <Status
        profile={profile}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
      />

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
            onClose={() => {
              setShowPostModal(false);
            }}
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
            onClose={() => {
              setShowVideoModal(false);
            }}
            profileId={profile?.id}
            onVideoAdded={(newVideo) => {
              if (onboardingActionRef.current) {
                onboardingActionRef.current = false;
                onboardingCompletionPendingRef.current = true;
              }
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

      <AnimatePresence>
        {showAboutMeModal && (
          <AboutMeModal
            profile={profile}
            isOpen={showAboutMeModal}
            onClose={() => {
              setShowAboutMeModal(false);
            }}
            onUpdate={() => {
              if (onboardingActionRef.current) {
                onboardingActionRef.current = false;
                onboardingCompletionPendingRef.current = true;
              }
              fetchProfile();
            }}
            supabase={supabase}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSocialLinksModal && (
          <SocialLinksModal
            profile={profile}
            isOpen={showSocialLinksModal}
            onClose={() => {
              setShowSocialLinksModal(false);
            }}
            onUpdate={() => {
              if (onboardingActionRef.current) {
                onboardingActionRef.current = false;
                onboardingCompletionPendingRef.current = true;
              }
              fetchProfile();
            }}
            supabase={supabase}
          />
        )}
      </AnimatePresence>

      {/* Progressive Onboarding Modal */}
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
              className="relative bg-gradient-to-br from-gray-900 to-black border border-[#C58B2A]/20 rounded-xl p-5 max-w-sm w-full shadow-2xl shadow-[#C58B2A]/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 rounded-t-xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C58B2A] to-[#A96F1F]"
                  initial={{ width: `${((onboardingStep) / (onboardingSteps.length - 1)) * 100}%` }}
                  animate={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {(currentStep.isFinal || onboardingStep === 0) && (
                <button
                  onClick={handleCloseOnboarding}
                  className="absolute top-2 right-2 text-white/30 hover:text-white/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-[10px] text-white/30">
                  Step {onboardingStep + 1} of {onboardingSteps.length}
                </span>
                <div className="flex gap-1">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${(
                        index === onboardingStep
                          ? 'w-4 bg-[#C58B2A]'
                          : index < onboardingStep
                          ? 'w-1 bg-[#C58B2A]/30'
                          : 'w-1 bg-white/10'
                      )}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <h2 className="text-base font-bold text-white">
                  {currentStep.title}
                </h2>

                {currentStep.images && onboardingStep === 1 && (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border border-[#C58B2A]/20 shadow-lg shadow-[#C58B2A]/10">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={photoExampleIndex}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={currentStep.images[photoExampleIndex]}
                            alt={`Example ${photoExampleIndex + 1}`}
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
                          aria-label={`Show example ${index + 1}`}
                          onClick={() => setPhotoExampleIndex(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === photoExampleIndex ? 'w-4 bg-[#C58B2A]' : 'w-1.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.images && onboardingStep === 2 && (
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
                            index === galleryImageIndex ? 'w-4 bg-[#C58B2A]' : 'w-1.5 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm font-medium text-white/70 leading-relaxed">
                  {currentStep.description}
                </p>

                <div className="space-y-1">
                  {(currentStep.tips || []).map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-sm font-medium text-white/60">
                      <Check className="w-3 h-3 text-[#C58B2A] flex-shrink-0 mt-0.5" />
                      <span className="text-xs">{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1.5">
                  {currentStep.isFinal ? (
                    <button
                      onClick={handleFinalStepComplete}
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Got It!
                    </button>
                  ) : currentStep.action ? (
                    <button
                      onClick={() => handleOnboardingAction(currentStep.action)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      {currentStep.action === 'upload_photos' && <Upload className="w-3.5 h-3.5" />}
                      {currentStep.action === 'upload_video' && <Film className="w-3.5 h-3.5" />}
                      {currentStep.action === 'about_me' && <User className="w-3.5 h-3.5" />}
                      {currentStep.action === 'social_links' && <Link2 className="w-3.5 h-3.5" />}
                      {currentStep.action === 'upload_photos' && 'Upload Photos'}
                      {currentStep.action === 'upload_video' && 'Upload Video'}
                      {currentStep.action === 'about_me' && 'Tell Us About You'}
                      {currentStep.action === 'social_links' && 'Add Social Links'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNextOnboarding}
                      className="w-full px-3 py-2 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {onboardingStep > 0 && !currentStep.action && !currentStep.isFinal && (
                  <button
                    onClick={handlePreviousOnboarding}
                    className="w-full text-[10px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="absolute -top-1 -right-1 opacity-10">
                <Sparkles className="w-5 h-5 text-[#C58B2A]" />
              </div>
              <div className="absolute -bottom-1 -left-1 opacity-10">
                <Sparkles className="w-5 h-5 text-[#C58B2A]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}