// app/event-gallery/page.js
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Image as ImageIcon, Video, X, Heart, Eye, Calendar, User, Play, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

const EventGalleryPage = () => {
  const [activeTab, setActiveTab] = useState('images');
  const [galleryPosts, setGalleryPosts] = useState([]);
  const [videoPosts, setVideoPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [galleryResult, videoResult] = await Promise.allSettled([
          supabase.from('who_win').select('celeb_gallery').eq('id', 1).maybeSingle(),
          supabase.from('who_win').select('video').eq('id', 1).maybeSingle(),
        ]);

        if (galleryResult.status === 'fulfilled' && !galleryResult.value.error) {
          const data = galleryResult.value.data;
          if (data?.celeb_gallery && Array.isArray(data.celeb_gallery)) {
            const sortedPosts = data.celeb_gallery
              .filter((post) => post.type === 'image')
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setGalleryPosts(sortedPosts);
          }
        }

        if (videoResult.status === 'fulfilled' && !videoResult.value.error) {
          const data = videoResult.value.data;
          if (data?.video && Array.isArray(data.video)) {
            const sortedVideos = [...data.video].sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
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

  const imagePosts = useMemo(() => galleryPosts, [galleryPosts]);

  const tabs = useMemo(() => [
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      color: 'from-orange-500 to-yellow-400',
      count: imagePosts.length,
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      color: 'from-green-500 to-emerald-400',
      count: videoPosts.length,
    },
  ], [imagePosts.length, videoPosts.length]);

  // ===== Helpers =====
  const getYouTubeEmbedUrl = useCallback((url, autoplay = false) => {
    if (!url) return '';
    const videoId =
      url.split('youtu.be/')[1]?.split('?')[0] ||
      url.split('v=')[1]?.split('&')[0] ||
      url.split('embed/')[1]?.split('?')[0] ||
      url.split('shorts/')[1]?.split('?')[0];
    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`;
  }, []);

  const getYouTubeThumbnail = useCallback((url) => {
    if (!url) return null;
    const videoId =
      url.split('youtu.be/')[1]?.split('?')[0] ||
      url.split('v=')[1]?.split('&')[0] ||
      url.split('embed/')[1]?.split('?')[0] ||
      url.split('shorts/')[1]?.split('?')[0];
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return formatDate(dateString);
  }, [formatDate]);

  const getRandomStats = useCallback((id) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      views: 500 + (hash % 5000),
      likes: 100 + (hash % 900),
    };
  }, []);

  const isYouTube = useCallback((post) => {
    return post?.media?.[0]?.provider === 'youtube' ||
      /youtube\.com|youtu\.be/.test(post?.media?.[0]?.url || '');
  }, []);

  const isVideoPost = useCallback((post) => post?.type === 'video', []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black pt-4">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-xs mx-auto mb-6">
              <div className="bg-black/40 rounded-lg p-0.5">
                <div className="flex gap-1">
                  <div className="flex-1 h-8 bg-gray-800/50 rounded-md animate-pulse"></div>
                  <div className="flex-1 h-8 bg-gray-800/50 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
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
          {/* Page Header */}
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
            {/* IMAGES TAB */}
            {activeTab === 'images' && (
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
                            <span className="text-[8px] text-white">{stats.views}</span>
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
            )}

            {/* VIDEOS TAB — YouTube-style grid (view counts removed) */}
            {activeTab === 'videos' && (
              videoPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                  {videoPosts.map((post) => {
                    const videoUrl = post.media[0]?.url;
                    const thumbnailUrl = getYouTubeThumbnail(videoUrl);
                    const isYT = isYouTube(post);

                    return (
                      <div
                        key={post.id}
                        onClick={() => setSelectedMedia(post)}
                        className="group cursor-pointer flex flex-col"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={post.caption || 'Video thumbnail'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <video
                              src={videoUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          )}
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white" fill="white" />
                            </div>
                          </div>
                          {/* Source badge */}
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <span className="text-[10px] text-white font-medium">
                              {isYT ? 'YT' : 'Video'}
                            </span>
                          </div>
                        </div>

                        {/* Meta below thumbnail */}
                        <div className="flex gap-2 mt-3">
                          {/* Channel avatar */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white text-xs font-bold">
                            W
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white text-xs md:text-sm font-semibold line-clamp-2 leading-snug">
                              {post.caption || 'Untitled video'}
                            </h3>
                            <p className="text-white/50 text-[11px] mt-1">
                              WhoWin Show
                            </p>
                            <p className="text-white/40 text-[10px] mt-0.5">
                              {formatTimeAgo(post.created_at)}
                            </p>
                          </div>
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

            <div className="mt-3 h-0.5 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 animate-gradient-x"></div>
          </div>
        </div>
      </div>

      {/* ===== MODAL: VIDEO (YouTube watch-page layout, view counts removed) ===== */}
      {selectedMedia && isVideoPost(selectedMedia) && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="min-h-full p-3 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (fixed) */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="fixed top-3 right-3 z-30 p-2 bg-black/70 backdrop-blur-sm rounded-full hover:bg-black/90 transition-colors border border-white/20"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="max-w-7xl mx-auto pt-10 md:pt-0">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* ===== Main video column ===== */}
                <div className="flex-1 min-w-0">
                  {/* Video player */}
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                    {isYouTube(selectedMedia) ? (
                      <iframe
                        key={selectedMedia.id}
                        src={
                          selectedMedia.media[0]?.embedUrl ||
                          getYouTubeEmbedUrl(selectedMedia.media[0]?.url, true)
                        }
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedMedia.caption || 'Video'}
                      />
                    ) : (
                      <video
                        key={selectedMedia.id}
                        src={selectedMedia.media[0]?.url}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                        preload="metadata"
                        playsInline
                      />
                    )}
                  </div>

                  {/* Title + meta below player */}
                  <div className="mt-3 md:mt-4">
                    <h1 className="text-base md:text-lg font-bold text-white leading-snug">
                      {selectedMedia.caption || 'Untitled video'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] md:text-xs text-white/50">
                      <span>{formatDate(selectedMedia.created_at)}</span>
                      {selectedMedia.media[0]?.provider && (
                        <>
                          <span>•</span>
                          <span className="uppercase">{selectedMedia.media[0].provider}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-white text-sm font-bold">
                          W
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">WhoWin Show</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setLiked(!liked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          liked
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-400 text-red-400' : ''}`} />
                        <span>{liked ? 'Liked' : 'Like'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ===== Right sidebar — other videos (view counts removed) ===== */}
                <aside className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0">
                  <h2 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4 text-green-400" />
                    More videos
                  </h2>

                  <div className="space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
                    {videoPosts
                      .filter((v) => v.id !== selectedMedia.id)
                      .map((item) => {
                        const thumb = getYouTubeThumbnail(item.media[0]?.url);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedMedia(item);
                              setLiked(false);
                            }}
                            className="w-full flex gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="relative flex-shrink-0 w-32 md:w-36 aspect-video rounded-md overflow-hidden bg-black">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <video
                                  src={item.media[0]?.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="w-4 h-4 text-white/80" fill="white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-white text-xs font-medium line-clamp-2 leading-snug">
                                {item.caption || 'Untitled video'}
                              </p>
                              <p className="text-white/40 text-[10px] mt-1">
                                WhoWin Show
                              </p>
                              <p className="text-white/40 text-[10px]">
                                {formatTimeAgo(item.created_at)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: IMAGE (unchanged) ===== */}
      {selectedMedia && !isVideoPost(selectedMedia) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-black rounded-lg border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-3 right-3 z-20 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors border border-white/20"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="grid md:grid-cols-2 h-full">
              <div className="relative h-[45vh] md:h-auto bg-black flex items-center justify-center">
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
              </div>

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