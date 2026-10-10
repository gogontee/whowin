// /components/profile/PostDetailModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera,
  Trash2,
  Share2,
  Download,
  Edit3,
  Check,
  X as XIcon,
  User,
  Youtube
} from 'lucide-react';

export default function PostDetailModal({ 
  post, 
  profile, 
  isOwner, 
  onClose, 
  onDelete, 
  onEdit,
  getEmbedUrl,
  allPosts = [],
  initialIndex = 0
}) {
  // ===== currentImageIndex = the index of the image WITHIN this post's media array =====
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  
  const videoRef = useRef(null);
  const editInputRef = useRef(null);

  // The post we're showing (always the one passed in — no jumping between posts)
  const currentPost = post;

  // All media inside this post (images of a carousel, or a single video)
  const media = Array.isArray(currentPost?.media) ? currentPost.media : [];
  const totalMedia = media.length;
  const isVideo = currentPost?.type === 'video';

  // Reset the image index whenever a new post opens or parent changes initialIndex
  useEffect(() => {
    setCurrentImageIndex(initialIndex || 0);
    setIsPlaying(false);
    setIsEditing(false);
  }, [currentPost?.id, initialIndex]);

  // Set edit caption when post changes
  useEffect(() => {
    setEditCaption(currentPost?.caption || '');
    setIsEditing(false);
    setIsPlaying(false);
  }, [currentPost?.id, currentPost?.caption]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  // ===== Navigation within THIS post's media array =====
  const handleNext = () => {
    if (totalMedia > 1 && currentImageIndex < totalMedia - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrev = () => {
    if (totalMedia > 1 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, totalMedia]);

  // Get the current media URL (handles both string and object forms)
  const currentMediaItem = media[currentImageIndex];
  const currentUrl =
    typeof currentMediaItem === 'string'
      ? currentMediaItem
      : currentMediaItem?.url || currentMediaItem?.embedUrl || '';

  // Check if URL is a YouTube link
  const isYouTubeUrl = (url) => {
    return url?.includes('youtu.be') || url?.includes('youtube.com') || url?.includes('youtube/embed');
  };

  // Handle video playback for direct videos
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${profile?.full_name || 'user'}`,
          text: currentPost.caption || 'Check out this post!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle download (only for images)
  const handleDownload = async () => {
    if (currentPost.type !== 'image') return;
    
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${currentPost.id}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  // Handle edit save
  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(currentPost.id, editCaption);
    }
    setIsEditing(false);
  };

  // Handle edit cancel
  const handleCancelEdit = () => {
    setEditCaption(currentPost.caption || '');
    setIsEditing(false);
  };

  // Get author info from profile
  const authorName = profile?.full_name || 'user';
  const authorUsername = profile?.username || 'username';
  const authorAvatar = profile?.avatar_url || null;
  const authorLocation = profile?.location || null;

  // Check if this is a YouTube video
  const videoUrl = isVideo ? currentUrl : null;
  const isYouTube = isVideo && isYouTubeUrl(videoUrl);
  const embedUrl = isVideo ? getEmbedUrl(videoUrl) : '';

  // Guard: if post is missing, bail gracefully
  if (!currentPost) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Desktop navigation arrows — cycle within THIS post's media */}
      {!isVideo && totalMedia > 1 && (
        <>
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="hidden md:block fixed left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {currentImageIndex < totalMedia - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="hidden md:block fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </>
      )}

      {/* Main content - Single post view */}
      <div 
        className="w-full h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-full flex flex-col">
          <div className="w-full min-h-screen flex flex-col bg-black">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 bg-black/90 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burnt-orange-500 to-yellow-500 overflow-hidden flex items-center justify-center">
                  {authorAvatar ? (
                    <Image src={authorAvatar} alt={authorName} width={40} height={40} className="object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <Link href={`/${authorUsername}`} className="font-semibold text-white text-sm hover:underline">
                    {authorName}
                  </Link>
                  {authorLocation && (
                    <p className="text-xs text-white/40">{authorLocation}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOwner && !isEditing && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      title="Edit caption"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => onDelete(currentPost)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </>
                )}
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="relative flex-1 bg-black flex items-center justify-center">
              {!isVideo ? (
                // ===== IMAGE (with carousel navigation for multi-image posts) =====
                <div className="relative w-full h-[70vh] md:h-[80vh]">
                  {totalMedia > 0 ? (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentImageIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={currentUrl}
                            alt={`Image ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                          />
                        </motion.div>
                      </AnimatePresence>

                      {/* Mobile navigation arrows (visible on small screens) */}
                      {totalMedia > 1 && (
                        <>
                          {currentImageIndex > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                              className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10"
                            >
                              <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                          )}
                          {currentImageIndex < totalMedia - 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleNext(); }}
                              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10"
                            >
                              <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                          )}

                          {/* Image counter badge (bottom center) */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 z-10">
                            <span className="text-xs text-white">
                              {currentImageIndex + 1} / {totalMedia}
                            </span>
                          </div>

                          {/* Dot indicators (bottom right) */}
                          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
                            {media.map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                                className={`h-1.5 rounded-full transition-all ${
                                  i === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                                }`}
                                aria-label={`Go to image ${i + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                      No media available
                    </div>
                  )}
                </div>
              ) : (
                // ===== VIDEO =====
                <div className="relative w-full h-[70vh] md:h-[80vh]">
                  {isYouTube ? (
                    // YouTube video - use iframe
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    // Direct video file - use video element
                    <>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        loop
                        playsInline
                        onClick={togglePlay}
                        onError={(e) => {
                          console.error('Video error:', e);
                        }}
                      />
                      {/* Video play/pause overlay */}
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30"
                      >
                        {!isPlaying && (
                          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-white" fill="white" />
                          </div>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Caption and Actions */}
            <div className="p-4 bg-black/90 border-t border-white/10">
              {/* Caption - Editable */}
              <div className="mb-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      ref={editInputRef}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Write a caption..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:border-burnt-orange-500 focus:outline-none transition-colors resize-none"
                      rows="3"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
                      >
                        <XIcon className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-white/80">
                      {currentPost.caption || 'No caption'}
                    </p>
                    <p className="text-xs text-white/40 mt-2">
                      {new Date(currentPost.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
                {currentPost.type === 'image' && (
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </button>
                )}
                {currentPost.type === 'video' && isYouTube && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Watch on YouTube"
                  >
                    <Youtube className="w-5 h-5 text-red-500" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image counter — only for multi-image carousels (top center) */}
      {!isVideo && totalMedia > 1 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white z-50">
          {currentImageIndex + 1} / {totalMedia}
        </div>
      )}
    </motion.div>
  );
}