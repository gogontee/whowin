// components/Home/FeaturedPost.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Share2, Image as ImageIcon, Video, Play, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();
};

const HIDE_DELAY = 3000;

export default function FeaturedPost() {
  const router = useRouter();
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  // Only controls the custom overlay (caption + share + arrows).
  // Native <video controls> are always on and handled by the browser.
  const [overlayVisible, setOverlayVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const videoRefs = useRef(new Map());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  // Auto-advance for images only.
  useEffect(() => {
    if (featuredContent.length <= 1) return;

    const currentItem = featuredContent[currentIndex];
    if (currentItem?.type === 'video') return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredContent, currentIndex]);

  const fetchFeaturedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('featured_post')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data?.featured_post && Array.isArray(data.featured_post) && data.featured_post.length > 0) {
        setFeaturedContent(data.featured_post);
      } else {
        setFeaturedContent([]);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
      setFeaturedContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getCurrentItem = useCallback(() => {
    if (featuredContent.length === 0) return null;
    return featuredContent[currentIndex];
  }, [featuredContent, currentIndex]);

  // ===== Overlay visibility =====
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, HIDE_DELAY);
  }, [clearHideTimer]);

  const revealOverlay = useCallback(() => {
    setOverlayVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const handleVideoPlay = useCallback(() => {
    // Video started playing — let the overlay fade out after 3s.
    scheduleHide();
  }, [scheduleHide]);

  const handleVideoPause = useCallback(() => {
    // Paused — keep the overlay visible.
    clearHideTimer();
    setOverlayVisible(true);
  }, [clearHideTimer]);

  const handleVideoEnded = useCallback(() => {
    clearHideTimer();
    setOverlayVisible(true);
    if (featuredContent.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
    }
  }, [clearHideTimer, featuredContent.length]);

  // On item change: show overlay briefly, then fade out for videos.
  useEffect(() => {
    clearHideTimer();
    setOverlayVisible(true);
    const item = featuredContent[currentIndex];
    if (item?.type === 'video') {
      scheduleHide();
    }
    return () => clearHideTimer();
  }, [currentIndex, featuredContent, clearHideTimer, scheduleHide]);

  // Play active video from start; pause all others.
  useEffect(() => {
    if (featuredContent.length === 0) return;

    videoRefs.current.forEach((videoEl, key) => {
      if (!videoEl) return;
      const itemIndex = featuredContent.findIndex(
        (it, i) => (it.id || `idx-${i}`) === key
      );
      const isActive = itemIndex === currentIndex;

      if (isActive) {
        try {
          videoEl.currentTime = 0;
          const playPromise = videoEl.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        } catch (e) {}
      } else {
        try {
          videoEl.pause();
        } catch (e) {}
      }
    });
  }, [currentIndex, featuredContent]);

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Who Wins Show',
          text: item.caption || 'Check out this highlight from the Who Wins show!',
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  const handleReadMore = () => router.push('/event-gallery');

  const handleSelectItem = (index) => setCurrentIndex(index);
  const handlePrev = () =>
    setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length);
  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % featuredContent.length);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">FEATURED</div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Featured Content</h2>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 animate-pulse">
          <div className="aspect-[16/9] md:aspect-[21/9] bg-gray-800"></div>
        </div>
      </section>
    );
  }

  if (featuredContent.length === 0) return null;

  const currentItem = getCurrentItem();
  const isVideo = currentItem?.type === 'video';

  // ===== Media stack (crossfade) =====
  // Native video controls are ALWAYS on (never toggled).
  // The custom overlay is a separate absolutely-positioned layer.
  const renderMediaStack = () => (
    <div className="relative w-full h-full">
      {featuredContent.map((item, index) => {
        const itemIsActive = index === currentIndex;
        const itemIsVideo = item.type === 'video';
        const itemKey = item.id || `idx-${index}`;

        return (
          <div
            key={itemKey}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              itemIsActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {itemIsVideo ? (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(itemKey, el);
                    else videoRefs.current.delete(itemKey);
                  }}
                  src={item.media[0]?.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  controls
                  preload={itemIsActive ? 'auto' : 'metadata'}
                  onPlay={itemIsActive ? handleVideoPlay : undefined}
                  onPause={itemIsActive ? handleVideoPause : undefined}
                  onEnded={itemIsActive ? handleVideoEnded : undefined}
                  onError={() => handleImageError(item.id)}
                />
              </div>
            ) : (
              <div className="relative w-full h-full">
                {imageErrors[item.id] ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/20" />
                  </div>
                ) : (
                  <img
                    src={item.media[0]?.url}
                    alt={item.caption || 'Featured content'}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(item.id)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Custom overlay — caption, share, arrows.
  // Sits at z-30 (above the video) so it can fade out without affecting native controls.
  // For videos: only visible when overlayVisible is true.
  // For images: always visible.
  const renderOverlay = (compact = false) => {
    const padding = compact ? 'p-4' : 'p-6';
    const titleSize = compact ? 'text-sm' : 'text-lg md:text-xl';
    const visible = isVideo ? overlayVisible : true;

    return (
      <div
        className={`absolute inset-0 z-30 transition-opacity duration-500 pointer-events-none ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top gradient — pointer-events-none so clicks pass through */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>

        {/* Bottom gradient + caption — only the caption text is non-clickable; the wrapper is pointer-events-none */}
        <div
          key={currentIndex}
          className={`absolute bottom-0 left-0 right-0 ${padding} pb-14 animate-[fadeIn_0.6s_ease-in-out] pointer-events-none`}
        >
          <div className="flex items-center gap-2 mb-2">
            {currentItem.type === 'image' ? (
              <span className="px-2 py-0.5 bg-orange-500/80 rounded-full text-white text-[10px] font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                PHOTO
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-500/80 rounded-full text-white text-[10px] font-medium flex items-center gap-1">
                <Video className="w-3 h-3" />
                VIDEO
              </span>
            )}
            <span className="text-white/50 text-xs">•</span>
            <span className="text-white/50 text-xs">Who Wins Show</span>
          </div>
          {currentItem.caption && (
            <h3 className={`${titleSize} font-bold text-white line-clamp-2`}>
              {currentItem.caption}
            </h3>
          )}
        </div>

        {/* Share button — pointer-events-auto so it IS clickable */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShare(currentItem);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10 pointer-events-auto"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4 text-white" />
        </button>

        {/* Navigation arrows — pointer-events-auto so they ARE clickable */}
        {featuredContent.length > 1 && !compact && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10 pointer-events-auto"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10 pointer-events-auto"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>
    );
  };

  // Desktop Layout
  if (!isMobile) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">FEATURED</div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Featured Content</h2>
          </div>
          <button
            onClick={handleReadMore}
            className="text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            <span>VIEW ALL</span>
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div
              className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 group"
              onMouseEnter={revealOverlay}
              onMouseMove={revealOverlay}
              onTouchStart={revealOverlay}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {renderMediaStack()}
                {renderOverlay(false)}
              </div>
            </div>
          </div>

          <div className="w-[30%] max-w-[300px]">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-3 h-full overflow-y-auto max-h-[400px]">
              <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 px-2">All Content</h4>
              <div className="space-y-2">
                {featuredContent.map((item, index) => {
                  const isActive = index === currentIndex;
                  const itemIsVideo = item.type === 'video';

                  return (
                    <button
                      key={item.id || index}
                      onClick={() => handleSelectItem(index)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-800">
                        {itemIsVideo ? (
                          <div className="w-full h-full bg-black/80 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white/40" fill="white" />
                          </div>
                        ) : (
                          <img src={item.media[0]?.url} alt="" className="w-full h-full object-cover" />
                        )}
                        {isActive && <div className="absolute inset-0 bg-orange-400/20"></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                          {item.caption || (itemIsVideo ? 'Video' : 'Image')}
                        </p>
                        <p className="text-[10px] text-white/30">{formatTimeAgo(item.created_at)}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {itemIsVideo ? (
                          <Video className="w-3 h-3 text-green-400" />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-orange-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Mobile Layout
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">FEATURED</div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Featured Content</h2>
        </div>
        <button
          onClick={handleReadMore}
          className="text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <Calendar className="w-3 h-3" />
          <span>VIEW ALL</span>
        </button>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 group"
        onTouchStart={revealOverlay}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {renderMediaStack()}
          {renderOverlay(true)}
        </div>

        {featuredContent.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-40">
            {featuredContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 bg-orange-400'
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}