// /components/profile/ProfileTabs.js
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Grid, 
  Video, 
  Plus, 
  Play,
  Image as ImageIcon,
  Info,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  Globe,
  Link as LinkIcon,
  Settings
} from 'lucide-react';

export default function ProfileTabs({ 
  activeTab, 
  onTabChange, 
  postCount, 
  videoCount, 
  posts, 
  isOwner, 
  onPostClick,
  onAddPhoto,
  onAddVideo,
  onSettingsClick, // Add new prop
  profile
}) {
  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === 'videos') {
      return posts.filter(post => post.type === 'video');
    }
    return posts; // 'posts' tab shows all posts (images + videos)
  };

  const filteredPosts = getFilteredPosts();
  const isAboutTab = activeTab === 'about';
  const showSocialIcons = profile?.social_control === true;

  return (
    <div className="px-4">
      {/* Tabs - Posts, Videos, About */}
      <div className="flex border-t border-white/10">
        <button
          onClick={() => onTabChange('posts')}
          className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm transition-colors relative ${
            activeTab === 'posts' ? 'text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Grid className="w-3 h-3 md:w-4 md:h-4" />
          <span>Posts ({postCount})</span>
          {activeTab === 'posts' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-yellow-500"
            />
          )}
        </button>
        
        <button
          onClick={() => onTabChange('videos')}
          className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm transition-colors relative ${
            activeTab === 'videos' ? 'text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Video className="w-3 h-3 md:w-4 md:h-4" />
          <span>Videos ({videoCount})</span>
          {activeTab === 'videos' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-yellow-500"
            />
          )}
        </button>

        <button
          onClick={() => onTabChange('about')}
          className={`flex-1 py-2 md:py-3 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm transition-colors relative ${
            activeTab === 'about' ? 'text-white' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Info className="w-3 h-3 md:w-4 md:h-4" />
          <span>About</span>
          {activeTab === 'about' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-yellow-500"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {isAboutTab ? (
        <div className="py-4 space-y-4">
          {/* About Content */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-2">
              About {profile?.full_name || 'User'}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {profile?.bio || "No bio available yet."}
            </p>
            {profile?.bio && (
              <div className="mt-3 text-xs text-white/30">
                Last updated: {new Date(profile.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Social Links - Only if social_control is true */}
          {showSocialIcons && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                Connect With Me
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile?.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-pink-500/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      @{profile.instagram}
                    </span>
                    <span className="ml-auto text-xs text-white/30">Instagram</span>
                  </a>
                )}

                {profile?.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-black/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      @{profile.tiktok}
                    </span>
                    <span className="ml-auto text-xs text-white/30">TikTok</span>
                  </a>
                )}

                {profile?.facebook && (
                  <a
                    href={`https://facebook.com/${profile.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-blue-600/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      @{profile.facebook}
                    </span>
                    <span className="ml-auto text-xs text-white/30">Facebook</span>
                  </a>
                )}

                {profile?.youtube && (
                  <a
                    href={`https://youtube.com/@${profile.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-red-600/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                      <Youtube className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      @{profile.youtube}
                    </span>
                    <span className="ml-auto text-xs text-white/30">YouTube</span>
                  </a>
                )}

                {profile?.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-blue-400/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <Twitter className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      @{profile.twitter}
                    </span>
                    <span className="ml-auto text-xs text-white/30">Twitter/X</span>
                  </a>
                )}
              </div>

              {/* Website Link */}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-[#D4AF37]/30 mt-2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-white/80 text-sm group-hover:text-white transition-colors truncate">
                    {profile.website.replace(/^https?:\/\//, '').substring(0, 30)}
                  </span>
                  <span className="ml-auto text-xs text-white/30">Website</span>
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Gallery Grid */}
          <div className="py-4">
            {filteredPosts.length > 0 ? (
              <PostGrid posts={filteredPosts} onPostClick={onPostClick} />
            ) : (
              <EmptyState 
                activeTab={activeTab} 
                isOwner={isOwner} 
                onAddPhoto={onAddPhoto} 
                onAddVideo={onAddVideo} 
                onSettingsClick={onSettingsClick}
              />
            )}

            {/* Add Post Buttons for owners with existing posts */}
            {isOwner && filteredPosts.length > 0 && (
              <AddPostButtons 
                onAddPhoto={onAddPhoto} 
                onAddVideo={onAddVideo}
                onSettingsClick={onSettingsClick}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PostGrid({ posts, onPostClick }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          onClick={() => onPostClick(post)}
        >
          {post.type === 'image' ? (
            <Image
              src={post.media[0]?.url}
              alt={`Post ${index + 1}`}
              fill
              sizes="(max-width: 768px) 33vw, 300px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <VideoThumbnail post={post} />
          )}
          
          {/* Video indicator */}
          {post.type === 'video' && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
              <Play className="w-3 h-3 text-white" fill="white" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function VideoThumbnail({ post }) {
  const [imgError, setImgError] = useState(false);
  
  const getVideoId = (url) => {
    return url.split('youtu.be/')[1]?.split('?')[0] || 
           url.split('v=')[1]?.split('&')[0];
  };

  if (imgError) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center">
        <Play className="w-8 h-8 text-white/50" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-900/50 to-black">
      <Image
        src={`https://img.youtube.com/vi/${getVideoId(post.media[0]?.url)}/maxresdefault.jpg`}
        alt="Video thumbnail"
        fill
        sizes="(max-width: 768px) 33vw, 300px"
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
    </div>
  );
}

function EmptyState({ activeTab, isOwner, onAddPhoto, onAddVideo, onSettingsClick }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
        {activeTab === 'posts' && <ImageIcon className="w-8 h-8 text-white/20" />}
        {activeTab === 'videos' && <Video className="w-8 h-8 text-white/20" />}
      </div>
      <p className="text-white/40 text-sm">
        {activeTab === 'posts' && 'No posts yet'}
        {activeTab === 'videos' && 'No videos yet'}
      </p>
      {isOwner && (
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <button
            onClick={onAddPhoto}
            className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Photo
          </button>
          <button
            onClick={onAddVideo}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Video className="w-3 h-3" />
            Add Video
          </button>
          <button
            onClick={onSettingsClick}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
          >
            <Settings className="w-3 h-3" />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}

function AddPostButtons({ onAddPhoto, onAddVideo, onSettingsClick }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      <button
        onClick={onAddPhoto}
        className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Plus className="w-3 h-3" />
        Add Photo
      </button>
      <button
        onClick={onAddVideo}
        className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <Video className="w-3 h-3" />
        Add Video
      </button>
      <button
        onClick={onSettingsClick}
        className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
      >
        <Settings className="w-3 h-3" />
        Settings
      </button>
    </div>
  );
}