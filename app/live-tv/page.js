// app/live-tv/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Tv, Maximize, Minimize, Wifi, WifiOff } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function LiveTVPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isYouTube, setIsYouTube] = useState(false);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [videoError, setVideoError] = useState(false);
  const chromeTimerRef = useRef(null);
  
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchLiveVideo();
    monitorNetwork();
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.dispatchEvent(new CustomEvent('live-tv-chrome', { detail: { hidden: false } }));
      if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    };
  }, []);

  const setChromeVisibility = (hidden) => {
    window.dispatchEvent(new CustomEvent('live-tv-chrome', { detail: { hidden } }));
  };

  const showChromeTemporarily = () => {
    setChromeVisibility(false);
    if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    if (!videoRef.current?.paused || isYouTube) {
      chromeTimerRef.current = setTimeout(() => setChromeVisibility(true), 3000);
    }
  };

  const handleVideoPlay = () => setChromeVisibility(true);
  const handleVideoPause = () => {
    if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
    setChromeVisibility(false);
  };

  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
      '*'
    );
  };

  useEffect(() => {
    const handleYouTubeMessage = (event) => {
      if (!isYouTube || event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'onStateChange') {
          if (data.info === 1) setChromeVisibility(true);
          if (data.info === 2 || data.info === 0) handleVideoPause();
        }
      } catch {
        // Ignore unrelated postMessage payloads.
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [isYouTube]);

  useEffect(() => {
    const handlePlayerInteraction = (event) => {
      if (containerRef.current?.contains(event.target)) {
        showChromeTemporarily();
      }
    };

    document.addEventListener('touchstart', handlePlayerInteraction, { passive: true });
    document.addEventListener('pointerdown', handlePlayerInteraction);
    return () => {
      document.removeEventListener('touchstart', handlePlayerInteraction);
      document.removeEventListener('pointerdown', handlePlayerInteraction);
    };
  }, [isYouTube]);

  const fetchLiveVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('tv')
        .single();

      if (error) throw error;
      
      if (data?.tv && Array.isArray(data.tv) && data.tv.length > 0) {
        // Try to find a working URL - loop through available videos
        let workingUrl = null;
        let isYt = false;
        
        for (const item of data.tv) {
          const url = item?.url;
          if (!url) continue;
          
          // Check if it's a YouTube URL
          if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube/embed')) {
            workingUrl = url;
            isYt = true;
            break;
          }
          
          // For Supabase storage URLs, ensure they're properly formatted
          if (url.includes('supabase.co/storage')) {
            // Make sure the URL is publicly accessible
            workingUrl = url;
            isYt = false;
            break;
          }
        }
        
        if (workingUrl) {
          setVideoUrl(workingUrl);
          setIsYouTube(isYt);
          setVideoError(false);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Error fetching live video:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const monitorNetwork = () => {
    const updateNetworkQuality = () => {
      if (!navigator.onLine) {
        setNetworkQuality('offline');
        return;
      }
      
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection) {
          const downlink = connection.downlink;
          if (downlink < 0.5) setNetworkQuality('poor');
          else if (downlink < 2) setNetworkQuality('fair');
          else setNetworkQuality('good');
          return;
        }
      }
      
      setNetworkQuality('good');
    };

    updateNetworkQuality();
    window.addEventListener('online', () => setNetworkQuality('good'));
    window.addEventListener('offline', () => setNetworkQuality('offline'));
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkQuality);
    }

    return () => {
      window.removeEventListener('online', () => setNetworkQuality('good'));
      window.removeEventListener('offline', () => setNetworkQuality('offline'));
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateNetworkQuality);
      }
    };
  };

  const getYouTubeEmbedUrl = (url) => {
    // Extract video ID from various YouTube URL formats
    let videoId = null;
    
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&enablejsapi=1`;
    }
    return url;
  };

  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    setVideoError(true);
  };

  const handleRetry = () => {
    setVideoError(false);
    setLoading(true);
    fetchLiveVideo();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getNetworkIndicator = () => {
    switch(networkQuality) {
      case 'good':
        return { color: 'bg-green-500', text: 'Good Connection' };
      case 'fair':
        return { color: 'bg-yellow-500', text: 'Fair Connection' };
      case 'poor':
        return { color: 'bg-orange-500', text: 'Poor Connection' };
      case 'offline':
        return { color: 'bg-red-500', text: 'Offline' };
      default:
        return { color: 'bg-gray-500', text: 'Unknown' };
    }
  };

  const network = getNetworkIndicator();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 text-sm">Loading live stream...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center">
            <Tv className="w-8 h-8 text-white/40" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Stream Offline</h2>
          <p className="text-white/60 text-xs mb-4">
            The live stream is currently offline. Please check back later.
          </p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-3 py-3">
        <div className="max-w-4xl mx-auto">
          {/* Live TV Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Tv className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-xs text-orange-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  LIVE NOW
                </p>
              </div>
            </div>

            {/* Network Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${network.color} animate-pulse`}></div>
              <span className="text-[10px] text-white/40 hidden md:inline">{network.text}</span>
              {networkQuality === 'offline' ? (
                <WifiOff className="w-3 h-3 text-red-400" />
              ) : (
                <Wifi className={`w-3 h-3 ${network.color === 'bg-green-500' ? 'text-green-400' : network.color === 'bg-yellow-500' ? 'text-yellow-400' : 'text-orange-400'}`} />
              )}
            </div>
          </div>

          {/* Video Player Container */}
          <div 
            ref={containerRef}
            onClick={showChromeTemporarily}
            onTouchStart={showChromeTemporarily}
            className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg mx-auto"
            style={{ maxWidth: '900px' }}
          >
            <div className="relative" style={{ paddingTop: '56.25%' }}> {/* Standard 16:9 */}
              <div className="absolute inset-0">
                {videoError ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <Tv className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/60 text-sm mb-3">Video playback error</p>
                      <button 
                        onClick={handleRetry}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : isYouTube ? (
                  <iframe
                    key={videoUrl} // Force re-render when URL changes
                    ref={iframeRef}
                    src={getYouTubeEmbedUrl(videoUrl)}
                    onLoad={handleIframeLoad}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Live Stream"
                  />
                ) : (
                  <video
                    key={videoUrl} // Force re-render when URL changes
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain bg-black"
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    volume={volume / 100}
                    onError={handleVideoError}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              
              {/* Live Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-white">LIVE</span>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            {!videoError && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Volume controls */}
                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {!isYouTube && (
                      <div className="flex items-center gap-1.5 w-24">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-full h-1 bg-white/20 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        />
                        <span className="text-[10px] text-white/60 w-6">{volume}%</span>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Maximize className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stream Status */}
          {videoError && (
            <div className="mt-3 text-center">
              <p className="text-xs text-red-400">
                Unable to play video. Please check your connection and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}