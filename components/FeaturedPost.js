// components/FeaturedPost.js
'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Maximize2, X, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import Image from "next/image";
import { createBrowserClient } from '@supabase/ssr';

export default function FeaturedPost() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posterImages, setPosterImages] = useState([]);
  const [videoSources, setVideoSources] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [scrollInterval, setScrollInterval] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimeoutRef = useRef(null);
  const volumeTimeoutRef = useRef(null);

  // Fallback images from public folder
  const FALLBACK_IMAGES = [
    "/poster1.png",
    "/poster2.png",
    "/poster3.png",
  ];

  // Fallback video from public folder
  const FALLBACK_VIDEO = ["/video1.mp4"];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch data from who_win table
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('who_win')
          .select('carousel, tv')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching featured content:', error.message);
          setPosterImages(FALLBACK_IMAGES);
          setVideoSources(FALLBACK_VIDEO);
          setLoading(false);
          return;
        }

        // Process carousel images
        let images = [];
        if (data?.carousel && Array.isArray(data.carousel) && data.carousel.length > 0) {
          images = data.carousel.map(item => item.url);
        }

        // If no images in database, use fallback
        if (images.length === 0) {
          images = FALLBACK_IMAGES;
        }
        setPosterImages(images);

        // Process TV videos - get all videos from the tv array
        let videos = [];
        if (data?.tv && Array.isArray(data.tv) && data.tv.length > 0) {
          videos = data.tv.map(item => item.url);
        }

        // If no videos in database, use fallback
        if (videos.length === 0) {
          videos = FALLBACK_VIDEO;
        }
        setVideoSources(videos);

      } catch (error) {
        console.error('Error fetching featured content:', error);
        setPosterImages(FALLBACK_IMAGES);
        setVideoSources(FALLBACK_VIDEO);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % posterImages.length);
    resetTimeout();
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + posterImages.length) % posterImages.length);
    resetTimeout();
  };

  const handleGoTo = (index) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    resetTimeout();
  };

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleNext, 5000);
  };

  useEffect(() => {
    if (!isMobile || posterImages.length === 0) return;
    resetTimeout();
    return () => clearTimeout(timeoutRef.current);
  }, [activeIndex, isMobile, posterImages.length]);

  // DESKTOP: Auto-scrolling with increased speed
  useEffect(() => {
    if (isMobile || !scrollContainerRef.current || posterImages.length === 0) return;

    const startAutoScroll = () => {
      if (scrollInterval) clearInterval(scrollInterval);
      
      const interval = setInterval(() => {
        if (scrollContainerRef.current && !isUserInteracting) {
          const container = scrollContainerRef.current;
          const imageWidth = 280 + 16;
          
          container.scrollBy({
            left: imageWidth,
            behavior: 'smooth'
          });

          setTimeout(() => {
            if (container.scrollLeft >= (posterImages.length * imageWidth)) {
              container.scrollTo({ left: 0, behavior: 'instant' });
            }
          }, 500);
        }
      }, 2000);

      setScrollInterval(interval);
    };

    startAutoScroll();

    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [isMobile, posterImages.length, isUserInteracting]);

  // Handle user interaction
  const handleUserInteraction = () => {
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 8000);
  };

  // Video controls
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setShowVolumeControl(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeControl(false);
    }, 2000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setShowVolumeControl(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeControl(false);
    }, 2000);
  };

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentVideoTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    // Move to next video when current one ends
    if (videoSources.length > 1) {
      const nextIndex = (currentVideoIndex + 1) % videoSources.length;
      setCurrentVideoIndex(nextIndex);
      setCurrentVideoTime(0);
      setVideoDuration(0);
      // Auto-play next video
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            // Handle autoplay prevention gracefully
            console.log('Autoplay prevented:', err);
          });
        }
      }, 300);
    } else {
      // Loop single video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      }
    }
  };

  // Lightbox functions
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % posterImages.length);
  };

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + posterImages.length) % posterImages.length);
  };

  // Keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') lightboxNext();
      if (e.key === 'ArrowLeft') lightboxPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (scrollInterval) clearInterval(scrollInterval);
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Progress percentage
  const progressPercentage = videoDuration > 0 ? (currentVideoTime / videoDuration) * 100 : 0;

  // Get the current video URL
  const getCurrentVideoUrl = () => {
    if (videoSources.length === 0) return null;
    return videoSources[currentVideoIndex] || videoSources[0];
  };

  if (loading) {
    return (
      <section className="w-full bg-gray-800/90 py-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-500 animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Loading featured content...</p>
        </div>
      </section>
    );
  }

  // Check if we have content to display
  if ((!posterImages || posterImages.length === 0) && videoSources.length === 0) {
    return null;
  }

  // DESKTOP: Split screen layout
  if (!isMobile) {
    const infiniteImages = [...posterImages, ...posterImages, ...posterImages];
    const currentVideoUrl = getCurrentVideoUrl();
    const videoCount = videoSources.length;

    return (
      <>
        <section className="w-full bg-gray-800/90 py-8 overflow-hidden">
          <div className="flex h-[300px] max-w-7xl mx-auto px-4 gap-4">
            {/* Left Side - Image Scroll (50%) */}
            <div className="w-1/2 h-full relative">
              <div 
                ref={scrollContainerRef}
                className="relative h-full overflow-x-auto scrollbar-hide flex gap-4 pb-2 infinite-scroll"
                onMouseEnter={() => {
                  setIsUserInteracting(true);
                  if (interactionTimeoutRef.current) {
                    clearTimeout(interactionTimeoutRef.current);
                  }
                }}
                onMouseLeave={() => {
                  interactionTimeoutRef.current = setTimeout(() => {
                    setIsUserInteracting(false);
                  }, 3000);
                }}
                onScroll={handleUserInteraction}
                onTouchStart={handleUserInteraction}
                onMouseDown={handleUserInteraction}
                onWheel={handleUserInteraction}
              >
                {infiniteImages.map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className="relative h-full w-[280px] flex-shrink-0 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
                    onClick={() => openLightbox(idx % posterImages.length)}
                  >
                    <img
                      src={src}
                      alt={`Poster ${(idx % posterImages.length) + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Click to enlarge hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-xs font-medium text-green-400">
                        0{(idx % posterImages.length) + 1} / 0{posterImages.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Video Player (50%) */}
            <div className="w-1/2 h-full bg-gray-900/50 rounded-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-l from-green-500/5 via-transparent to-transparent" />
              
              {/* Video Counter Badge */}
              {videoCount > 1 && (
                <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <span className="text-white text-xs font-medium">
                    {currentVideoIndex + 1} / {videoCount}
                  </span>
                </div>
              )}
              
              <div className="relative w-full h-full">
                {currentVideoUrl ? (
                  <video
                    ref={videoRef}
                    src={currentVideoUrl}
                    autoPlay
                    muted={isMuted}
                    loop={false}
                    playsInline
                    volume={volume}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    key={currentVideoIndex}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <p className="text-white/40 text-sm">No video available</p>
                  </div>
                )}
                
                {/* Video Progress Bar */}
                {videoDuration > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                )}
                
                {/* Video Controls */}
                {currentVideoUrl && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                    {showVolumeControl && (
                      <div className="bg-gray-900/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={toggleMute}
                      className="bg-gray-900/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-gray-900/95 transition-colors"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (videoRef.current && videoRef.current.requestFullscreen) {
                          videoRef.current.requestFullscreen();
                        }
                      }}
                      className="bg-gray-900/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-gray-900/95 transition-colors"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            .infinite-scroll {
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
              transition: scroll-left 0.5s ease-in-out;
            }
            
            .infinite-scroll::-webkit-scrollbar {
              display: none;
            }

            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
            }
            
            input[type=range]::-moz-range-thumb {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
            }
          `}</style>
        </section>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-10 text-white/60 text-sm">
              {lightboxIndex + 1} / {posterImages.length}
            </div>

            {/* Main Image */}
            <div 
              className="relative w-[90vw] h-[80vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={posterImages[lightboxIndex]}
                alt={`Poster ${lightboxIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Navigation Buttons */}
            {posterImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxPrev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    lightboxNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {posterImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === lightboxIndex ? 'w-6 bg-green-500' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // MOBILE: Carousel with reduced spacing
  return (
    <>
      <section className="w-full bg-gray-800/90 py-2 overflow-hidden">
        <div className="relative">
          <div className="relative h-[380px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {[-1, 0, 1].map((offset) => {
                const index = (activeIndex + offset + posterImages.length) % posterImages.length;
                const isActive = offset === 0;

                let xPosition = "0%";
                let scale = 0.8;
                let opacity = 0.4;
                let zIndex = 10;

                if (offset === -1) {
                  xPosition = "-30%";
                  scale = 0.7;
                  opacity = 0.25;
                  zIndex = 5;
                } else if (offset === 0) {
                  xPosition = "0%";
                  scale = 1;
                  opacity = 1;
                  zIndex = 20;
                } else if (offset === 1) {
                  xPosition = "30%";
                  scale = 0.7;
                  opacity = 0.25;
                  zIndex = 5;
                }

                return (
                  <motion.div
                    key={index}
                    custom={direction}
                    initial={{ 
                      x: direction > 0 ? "100%" : "-100%", 
                      opacity: 0,
                      scale: 0.8
                    }}
                    animate={{ 
                      x: xPosition, 
                      opacity: opacity,
                      scale: scale,
                      transition: {
                        type: "spring",
                        stiffness: 280,
                        damping: 25,
                        mass: 0.8
                      }
                    }}
                    exit={{ 
                      x: direction < 0 ? "100%" : "-100%", 
                      opacity: 0,
                      scale: 0.7
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 25,
                      mass: 0.8
                    }}
                    drag={isMobile ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(event, info) => {
                      if (Math.abs(info.offset.x) > 50) {
                        if (info.offset.x > 0) {
                          handlePrev();
                        } else {
                          handleNext();
                        }
                      }
                    }}
                    className="absolute w-[260px] cursor-grab active:cursor-grabbing"
                    style={{ zIndex, touchAction: "pan-y" }}
                    onClick={() => {
                      if (!isActive) {
                        handleGoTo(index);
                      } else {
                        openLightbox(index);
                      }
                    }}
                  >
                    <div className={`relative aspect-[4/5] rounded-xl overflow-hidden shadow-xl ${
                      isActive ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-800/90' : ''
                    }`}>
                      <img
                        src={posterImages[index]}
                        alt={`Poster ${index + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      
                      {!isActive && (
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px]" />
                      )}
                      
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Dots - closer to carousel */}
          <div className="flex justify-center gap-1.5 mt-1">
            {posterImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleGoTo(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-5 bg-green-500' : 'w-1 bg-green-500/30'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal - Mobile */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 z-10 text-white/60 text-sm">
            {lightboxIndex + 1} / {posterImages.length}
          </div>

          {/* Main Image */}
          <div 
            className="relative w-[90vw] h-[70vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={posterImages[lightboxIndex]}
              alt={`Poster ${lightboxIndex + 1}`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Navigation Buttons */}
          {posterImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {posterImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === lightboxIndex ? 'w-6 bg-green-500' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}