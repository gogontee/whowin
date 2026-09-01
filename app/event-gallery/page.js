// app/event-gallery/page.js
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Image as ImageIcon, Video, X, Heart, Eye, Calendar, User, Play } from 'lucide-react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';

const EventGalleryPage = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [galleryPosts, setGalleryPosts] = useState([]);
  const [videoPosts, setVideoPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [liked, setLiked] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both in parallel from who_win table
        const [galleryResult, videoResult] = await Promise.allSettled([
          supabase.from('who_win').select('celeb_gallery').single(),
          supabase.from('who_win').select('video').single()
        ]);

        // Process gallery posts
        if (galleryResult.status === 'fulfilled' && !galleryResult.value.error) {
          const data = galleryResult.value.data;
          if (data?.celeb_gallery && Array.isArray(data.celeb_gallery)) {
            const sortedPosts = data.celeb_gallery
              .filter(post => post.type === 'image')
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setGalleryPosts(sortedPosts);
          }
        }

        // Process video posts
        if (videoResult.status === 'fulfilled' && !videoResult.value.error) {
          const data = videoResult.value.data;
          if (data?.video && Array.isArray(data.video)) {
            const sortedVideos = data.video.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            );
            setVideoPosts(sortedVideos);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoized values
  const imagePosts = useMemo(() => galleryPosts, [galleryPosts]);
  
  const tabs = useMemo(() => [
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      color: 'from-orange-500 to-yellow-400',
      count: imagePosts.length
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      color: 'from-green-500 to-emerald-400',
      count: videoPosts.length
    },
  ], [imagePosts.length, videoPosts.length]);

  // Optimized helper functions
  const getYouTubeEmbedUrl = useCallback((url) => {
    if (!url) return '';
    const videoId = url.split('youtu.be/')[1]?.split('?')[0] || 
                   url.split('v=')[1]?.split('&')[0] ||
                   url.split('embed/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }, []);

  const getYouTubeThumbnail = useCallback((url) => {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0] || 
                   url.split('v=')[1]?.split('&')[0] ||
                   url.split('embed/')[1]?.split('?')[0];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Generate random stats only once per item
  const getRandomStats = useCallback((id) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      views: 500 + (hash % 5000),
      likes: 100 + (hash % 900)
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pt-4">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Tab skeleton */}
            <div className="max-w-xs mx-auto mb-6">
              <div className="bg-black/40 rounded-lg p-0.5">
                <div className="flex gap-1">
                  <div className="flex-1 h-8 bg-gray-800/50 rounded-md animate-pulse"></div>
                  <div className="flex-1 h-8 bg-gray-800/50 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Gallery skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-800/30 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pt-3">
      <div className="container mx-auto px-3">
        <div className="max-w-6xl mx-auto">
          {/* Page Header with Description */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Event Gallery
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto">
              Explore highlights from the WHO WIN show
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-xs mx-auto mb-6">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-0.5">
              <div className="flex">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-md transition-all duration-300 text-xs ${
                        isActive 
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-sm` 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span className="font-medium">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className="ml-1 px-1 py-0.5 bg-white/20 rounded-full text-[9px]">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden p-3 md:p-4">
            {/* Active Content */}
            {activeTab === 'images' ? (
              imagePosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {imagePosts.map((post) => {
                    const stats = getRandomStats(post.id);
                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedMedia(post)}
                        className="group cursor-pointer relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-orange-500/30 transition-all duration-200"
                      >
                        <Image
                          src={post.media[0]?.url}
                          alt={post.caption || 'Gallery image'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          loading="lazy"
                          quality={75}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {post.caption && (
                            <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[9px] line-clamp-1">
                              {post.caption}
                            </p>
                          )}
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                            <Eye className="w-2 h-2 text-white" />
                            <span className="text-[8px] text-white">
                              {stats.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 mx-auto text-white/20 mb-3" />
                  <p className="text-white/60 text-xs">No images available</p>
                </div>
              )
            ) : (
              videoPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {videoPosts.map((post) => {
                    const videoUrl = post.media[0]?.url;
                    const thumbnailUrl = getYouTubeThumbnail(videoUrl);
                    const stats = getRandomStats(post.id);
                    
                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedMedia(post)}
                        className="group cursor-pointer relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-green-500/30 transition-all duration-200"
                      >
                        {thumbnailUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={thumbnailUrl}
                              alt={post.caption || 'Video thumbnail'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <video
                            src={videoUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 text-white" fill="white" />
                          </div>
                        </div>
                        {post.caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[9px] line-clamp-1">
                              {post.caption}
                            </p>
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 bg-green-500/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <span className="text-[8px] text-white font-medium">
                            {post.media[0]?.provider === 'youtube' ? 'YT' : 'Video'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="w-10 h-10 mx-auto text-white/20 mb-3" />
                  <p className="text-white/60 text-xs">No videos available</p>
                </div>
              )
            )}
            
            {/* Tab Indicator */}
            <div className="mt-3 h-0.5 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 animate-gradient-x"></div>
          </div>
        </div>
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedMedia(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-black rounded-lg border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-3 right-3 z-20 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors border border-white/20"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="grid md:grid-cols-2 h-full">
              {/* Left Side - Media */}
              <div className="relative h-[45vh] md:h-auto bg-black flex items-center justify-center">
                {selectedMedia.type === 'image' ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={selectedMedia.media[0]?.url}
                      alt={selectedMedia.caption || 'Gallery image'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      quality={85}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {selectedMedia.media[0]?.provider === 'youtube' ? (
                      <iframe
                        src={selectedMedia.media[0]?.embedUrl || getYouTubeEmbedUrl(selectedMedia.media[0]?.url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={selectedMedia.media[0]?.url}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Right Side - Details */}
              <div className="p-4 overflow-y-auto max-h-[45vh] md:max-h-[90vh]">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white mb-1">Caption</h3>
                  <p className="text-white/70 text-xs leading-relaxed">
                    {selectedMedia.caption || 'No caption provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-white/60 text-[9px] mb-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>Posted</span>
                    </div>
                    <p className="text-white text-xs font-medium">
                      {formatDate(selectedMedia.created_at)}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-white/60 text-[9px] mb-0.5">
                      <User className="w-2.5 h-2.5" />
                      <span>Type</span>
                    </div>
                    <p className="text-white text-xs font-medium capitalize">
                      {selectedMedia.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setLiked(!liked)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Heart className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{liked ? 'Liked' : 'Like'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default EventGalleryPage;