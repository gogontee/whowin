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
  Image as ImageIcon
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
      // Try auth but don't wait for it
      checkCurrentUser();
    }
  }, [profile]);

  // =====================
  // FETCH PROFILE - ALWAYS WORKS
  // =====================
  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile - this ALWAYS works, no auth needed
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
      
      // Ensure required fields exist
      if (profileData.vote_control === undefined || profileData.vote_control === null) {
        profileData.vote_control = false;
      }
      
      if (!profileData.image_url || !Array.isArray(profileData.image_url)) {
        profileData.image_url = [];
      }
      
      setProfile(profileData);

      // Fetch videos
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

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      setFollowers(followersCount || 0);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowing(followingCount || 0);

      // Fetch vote data
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
      // Try to get user - if it fails, just treat as guest
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setAuthChecked(true);
      
      // If auth fails, treat as guest - PROFILE STILL VISIBLE
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
      // Auth failed - just treat as guest
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
        <ProfileBanner
          profile={profile}
          isOwner={isOwner}
          uploadingPhoto={uploadingPhoto}
          uploadSuccess={uploadSuccess}
          showPhotoPopup={showPhotoPopup}
          onPhotoUpload={handlePhotoUpload}
          onClosePopup={() => setShowPhotoPopup(false)}
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
    </div>
  );
}