// /components/profile/ProfileTabs.js
'use client';

import { useState, useRef } from 'react';
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
  Settings,
  Film,
  Pause,
  Volume2,
  VolumeX
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
  onSettingsClick,
  profile
}) {
  const getFilteredPosts = () => {
    if (activeTab === 'videos') {
      return posts.filter(post => post.type === 'video');
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();
  const isAboutTab = activeTab === 'about';
  const showSocialIcons = profile?.social_control === true;

  return (
    <div className="px-4">
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
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F]"
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
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F]"
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
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F]"
            />
          )}
        </button>
      </div>

      {isAboutTab ? (
        <div className="py-4 space-y-4">
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

          {showSocialIcons && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C58B2A]" />
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

              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group border border-white/5 hover:border-[#C58B2A]/30 mt-2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C58B2A]/20 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-4 h-4 text-[#C58B2A]" />
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
  // Flatten posts - each media item becomes its own grid item
  const flattenedPosts = posts.flatMap(post => {
    if (post.type === 'image' && post.media && post.media.length > 0) {
      return post.media.map((mediaItem, index) => ({
        ...post,
        id: `${post.id}_${index}`, // Unique ID for each image
        media: [mediaItem], // Each item gets its own media array
        _originalPost: post, // Keep reference to original
        _imageIndex: index, // Track which image in the sequence
        _totalImages: post.media.length // Total images in the post
      }));
    }
    return [post]; // Keep videos and single images as is
  });

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {flattenedPosts.map((post, index) => {
        let postType = post.type || 'image';
        let mediaUrl = '';
        
        if (post.media && Array.isArray(post.media) && post.media.length > 0) {
          mediaUrl = post.media[0]?.url || post.media[0] || '';
        }
        
        if (!mediaUrl) {
          return (
            <motion.div
              key={post.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-white/5 flex items-center justify-center"
              onClick={() => onPostClick(post._originalPost || post)}
            >
              <div className="text-white/20 text-sm">No media</div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={post.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => onPostClick(post._originalPost || post)}
          >
            {postType === 'image' ? (
              <Image
                src={mediaUrl}
                alt={`Post ${index + 1}`}
                fill
                sizes="(max-width: 768px) 33vw, 300px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = '/image-placeholder.jpg';
                }}
              />
            ) : (
              <VideoThumbnail post={post} mediaUrl={mediaUrl} />
            )}
            
            {postType === 'video' && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                <Play className="w-3 h-3 text-white" fill="white" />
              </div>
            )}
            
            {/* Show image counter badge if there are multiple images */}
            {post._originalPost && post._originalPost.media && post._originalPost.media.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="text-[10px] text-white/80">
                  {post._imageIndex + 1}/{post._totalImages}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function VideoThumbnail({ post, mediaUrl }) {
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  
  let videoUrl = '';
  if (mediaUrl && typeof mediaUrl === 'string') {
    videoUrl = mediaUrl;
  } else if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    const url = post.media[0]?.url || post.media[0]?.embedUrl || '';
    if (typeof url === 'string') {
      videoUrl = url;
    }
  }
  
  const isValidVideoUrl = videoUrl && typeof videoUrl === 'string' && videoUrl.length > 0;
  const isYouTube = isValidVideoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  
  // For uploaded videos - use HTML5 video element with controls
  if (isValidVideoUrl && !isYouTube && !videoError) {
    return (
      <div 
        className="relative w-full h-full bg-gradient-to-br from-[#C58B2A]/20 to-purple-900/30 overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          onError={(e) => {
            console.error('Video error:', e);
            setVideoError(true);
          }}
          onClick={() => {
            if (videoRef.current) {
              if (isPlaying) {
                videoRef.current.pause();
              } else {
                videoRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          }}
        />
        
        {/* Play/Pause Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors cursor-pointer"
          onClick={() => {
            if (videoRef.current) {
              if (isPlaying) {
                videoRef.current.pause();
              } else {
                videoRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }
          }}
        >
          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center border border-white/30 transition-transform hover:scale-110">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Controls - appear on hover */}
        {isHovered && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-white" />
              ) : (
                <Volume2 className="w-3 h-3 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-1.5 py-0.5">
          <span className="text-[10px] text-white/80">Video</span>
        </div>
      </div>
    );
  }
  
  // For YouTube videos
  if (isYouTube) {
    const getVideoId = (url) => {
      if (!url) return null;
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([\w-]+)/,
        /(?:youtu\.be\/)([\w-]+)/,
        /(?:youtube\.com\/embed\/)([\w-]+)/,
        /(?:youtube\.com\/shorts\/)([\w-]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const videoId = getVideoId(videoUrl);
    
    if (videoId && !videoError) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-purple-900/50 to-black">
          <Image
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt="Video thumbnail"
            fill
            sizes="(max-width: 768px) 33vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setVideoError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center border border-white/30">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#C58B2A]/20 to-purple-900/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
          <Film className="w-6 h-6 text-white/60" />
        </div>
        <span className="text-[10px] text-white/40">Video</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center border border-white/30">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
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
        <div className="flex flex-nowrap gap-1.5 md:gap-3 justify-center mt-4">
          <button
            onClick={onAddPhoto}
            className="px-2 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:opacity-90 transition-opacity flex items-center gap-1 md:gap-2"
          >
            <Plus className="w-3 h-3 flex-shrink-0" />
            Add Photo
          </button>
          <button
            onClick={onAddVideo}
            className="px-2 py-1.5 md:px-4 md:py-2 bg-white/10 text-white rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:bg-white/20 transition-colors flex items-center gap-1 md:gap-2"
          >
            <Video className="w-3 h-3 flex-shrink-0" />
            Add Video
          </button>
          <button
            onClick={onSettingsClick}
            className="px-2 py-1.5 md:px-4 md:py-2 bg-white/10 text-white rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:bg-white/20 transition-colors flex items-center gap-1 md:gap-2 border border-white/10"
          >
            <Settings className="w-3 h-3 flex-shrink-0" />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}

function AddPostButtons({ onAddPhoto, onAddVideo, onSettingsClick }) {
  return (
    <div className="flex flex-nowrap gap-1.5 md:gap-3 justify-center mt-6">
      <button
        onClick={onAddPhoto}
        className="px-2 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:opacity-90 transition-opacity flex items-center gap-1 md:gap-2"
      >
        <Plus className="w-3 h-3 flex-shrink-0" />
        Add Photo
      </button>
      <button
        onClick={onAddVideo}
        className="px-2 py-1.5 md:px-4 md:py-2 bg-white/10 text-white rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:bg-white/20 transition-colors flex items-center gap-1 md:gap-2"
      >
        <Video className="w-3 h-3 flex-shrink-0" />
        Add Video
      </button>
      <button
        onClick={onSettingsClick}
        className="px-2 py-1.5 md:px-4 md:py-2 bg-white/10 text-white rounded-lg text-[10px] md:text-xs font-semibold whitespace-nowrap hover:bg-white/20 transition-colors flex items-center gap-1 md:gap-2 border border-white/10"
      >
        <Settings className="w-3 h-3 flex-shrink-0" />
        Settings
      </button>
    </div>
  );
}