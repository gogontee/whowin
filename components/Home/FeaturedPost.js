// components/Home/FeaturedPost.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Share2, Image as ImageIcon, Video, Play, ChevronRight, ChevronLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
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

export default function FeaturedPost() {
  const router = useRouter();
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  useEffect(() => {
    if (featuredContent.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredContent.length]);

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

  const getCurrentItem = () => {
    if (featuredContent.length === 0) return null;
    return featuredContent[currentIndex];
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Who Win Show',
          text: item.caption || 'Check out this highlight from the Who Win show!',
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

  const handleReadMore = () => {
    router.push('/event-gallery');
  };

  const handleSelectItem = (index) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredContent.length) % featuredContent.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredContent.length);
  };

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
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredContent.length === 0) return null;

  const currentItem = getCurrentItem();

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
          {/* Main Content - Left (70%) */}
          <div className="flex-1">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 group">
              <div className="relative aspect-[16/9] overflow-hidden">
                {currentItem.type === 'image' ? (
                  <div className="relative w-full h-full">
                    {imageErrors[currentItem.id] ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-white/20" />
                      </div>
                    ) : (
                      <img
                        src={currentItem.media[0]?.url}
                        alt={currentItem.caption || 'Featured content'}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(currentItem.id)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <video
                      src={currentItem.media[0]?.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls={false}
                      onError={() => handleImageError(currentItem.id)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
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
                    <span className="text-white/50 text-xs">Who Win Show</span>
                  </div>
                  {currentItem.caption && (
                    <h3 className="text-lg md:text-xl font-bold text-white line-clamp-2">
                      {currentItem.caption}
                    </h3>
                  )}
                </div>

                {/* Share button */}
                <button 
                  onClick={() => handleShare(currentItem)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>

                {/* Navigation arrows */}
                {featuredContent.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right (30%) */}
          <div className="w-[30%] max-w-[300px]">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-3 h-full overflow-y-auto max-h-[400px]">
              <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 px-2">All Content</h4>
              <div className="space-y-2">
                {featuredContent.map((item, index) => {
                  const isActive = index === currentIndex;
                  const isVideo = item.type === 'video';
                  
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
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-800">
                        {isVideo ? (
                          <div className="w-full h-full bg-black/80 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white/40" fill="white" />
                          </div>
                        ) : (
                          <img
                            src={item.media[0]?.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-orange-400/20"></div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                          {item.caption || (isVideo ? 'Video' : 'Image')}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {formatTimeAgo(item.created_at)}
                        </p>
                      </div>
                      
                      {/* Type badge */}
                      <div className="flex-shrink-0">
                        {isVideo ? (
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

  // Mobile Layout - Carousel
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

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10 group">
        <div className="relative aspect-[16/9] overflow-hidden">
          {currentItem.type === 'image' ? (
            <div className="relative w-full h-full">
              {imageErrors[currentItem.id] ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-white/20" />
                </div>
              ) : (
                <img
                  src={currentItem.media[0]?.url}
                  alt={currentItem.caption || 'Featured content'}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(currentItem.id)}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full h-full bg-black">
              <video
                src={currentItem.media[0]?.url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                onError={() => handleImageError(currentItem.id)}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" fill="white" />
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
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
              <span className="text-white/50 text-xs">Who Win Show</span>
            </div>
            {currentItem.caption && (
              <h3 className="text-sm font-bold text-white line-clamp-2">
                {currentItem.caption}
              </h3>
            )}
          </div>

          <button 
            onClick={() => handleShare(currentItem)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm border border-white/10"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Navigation dots */}
        {featuredContent.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-10">
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