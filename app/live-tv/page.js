// app/live-tv/page.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Tv, Maximize, Minimize, Wifi, WifiOff, SkipForward } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const FADE_DURATION = 800;
const CHROME_HIDE_DELAY = 3000;

export default function LiveTVPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [tvList, setTvList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [allFailed, setAllFailed] = useState(false);
  const [failedIds, setFailedIds] = useState(new Set());
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const chromeTimerRef = useRef(null);
  const videoRefs = useRef(new Map());
  const iframeRefs = useRef(new Map());
  const containerRef = useRef(null);

  // ===== Detect desktop =====
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // ===== Broadcast chrome visibility to GlobalNav =====
  const broadcastChrome = useCallback((hidden) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('live-tv-chrome', { detail: { hidden } }));
  }, []);

  // ===== Fetch playlist =====
  useEffect(() => {
    fetchLiveVideos();
    const cleanupNet = monitorNetwork();

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (chromeTimerRef.current) clearTimeout(chromeTimerRef.current);
      if (cleanupNet) cleanupNet();
      broadcastChrome(false);
    };
  }, [broadcastChrome]);

  const fetchLiveVideos = async () => {
    setLoading(true);
    setError(false);
    setAllFailed(false);
    setFailedIds(new Set());
    try {
      const { data, error } = await supabase
        .from('who_win')
        .select('tv')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data?.tv && Array.isArray(data.tv) && data.tv.length > 0) {
        const valid = data.tv
          .map((item, idx) => ({
            id: item.id || `tv-${idx}`,
            url: item?.url || '',
          }))
          .filter((it) => it.url);

        if (valid.length === 0) {
          setError(true);
          setTvList([]);
        } else {
          setTvList(valid);
          setCurrentIndex(0);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching live videos:', err);
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
    window.addEventListener('online', updateNetworkQuality);
    window.addEventListener('offline', updateNetworkQuality);
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkQuality);
    }
    return () => {
      window.removeEventListener('online', updateNetworkQuality);
      window.removeEventListener('offline', updateNetworkQuality);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateNetworkQuality);
      }
    };
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('youtube/embed')
    );
  };

  const getYouTubeEmbedUrl = (url, muted) => {
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
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;
    }
    return url;
  };

  // ===== Chrome visibility =====
  const clearChromeTimer = useCallback(() => {
    if (chromeTimerRef.current) {
      clearTimeout(chromeTimerRef.current);
      chromeTimerRef.current = null;
    }
  }, []);

  const scheduleChromeHide = useCallback(() => {
    clearChromeTimer();
    chromeTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
      broadcastChrome(true);
    }, CHROME_HIDE_DELAY);
  }, [clearChromeTimer, broadcastChrome]);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    broadcastChrome(false);
    scheduleChromeHide();
  }, [scheduleChromeHide, broadcastChrome]);

  // Reveal on any pointer/touch activity inside the player container
  useEffect(() => {
    const onActivity = (e) => {
      if (containerRef.current?.contains(e.target)) {
        revealChrome();
      }
    };
    document.addEventListener('pointermove', onActivity, { passive: true });
    document.addEventListener('pointerdown', onActivity);
    document.addEventListener('touchstart', onActivity, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onActivity);
      document.removeEventListener('pointerdown', onActivity);
      document.removeEventListener('touchstart', onActivity);
    };
  }, [revealChrome]);

  // Schedule initial hide on mount
  useEffect(() => {
    broadcastChrome(false);
    scheduleChromeHide();
    return () => clearChromeTimer();
  }, [scheduleChromeHide, broadcastChrome]);

  // ===== Advancing (no chrome reveal — stays hidden on switch) =====
  const advanceToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (tvList.length === 0) return prev;
      let next = (prev + 1) % tvList.length;
      let attempts = 0;
      while (failedIds.has(tvList[next]?.id) && attempts < tvList.length) {
        next = (next + 1) % tvList.length;
        attempts++;
      }
      return next;
    });
  }, [tvList, failedIds]);

  const handleItemFailed = useCallback((id) => {
    setFailedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (next.size >= tvList.length) setAllFailed(true);
      return next;
    });
    setTimeout(() => advanceToNext(), 100);
  }, [tvList.length, advanceToNext]);

  const handleVideoEnded = useCallback(() => {
    advanceToNext();
  }, [advanceToNext]);

  const handleVideoError = useCallback((id) => {
    console.error('Video error for:', id);
    handleItemFailed(id);
  }, [handleItemFailed]);

  // Play active native video, pause others
  useEffect(() => {
    if (tvList.length === 0) return;

    videoRefs.current.forEach((el, key) => {
      if (!el) return;
      const itemIndex = tvList.findIndex((it) => it.id === key);
      const isActive = itemIndex === currentIndex;

      if (isActive) {
        try {
          el.currentTime = 0;
          el.muted = isMuted;
          el.volume = volume / 100;
          const p = el.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      } else {
        try {
          el.pause();
        } catch (e) {}
      }
    });
  }, [currentIndex, tvList, isMuted, volume]);

  // YouTube ended → advance
  useEffect(() => {
    const handleYouTubeMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'onStateChange' && data.info === 0) {
          advanceToNext();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [advanceToNext]);

  const handleIframeLoad = (iframeEl) => {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
    iframeEl.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
      '*'
    );
  };

  // Apply mute/volume to iframes
  useEffect(() => {
    iframeRefs.current.forEach((el) => {
      if (!el?.contentWindow) return;
      el.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }),
        '*'
      );
      el.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }),
        '*'
      );
    });
  }, [isMuted, volume, currentIndex]);

  const toggleMute = () => setIsMuted((m) => !m);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSkip = () => advanceToNext();

  const handleRetry = () => {
    setFailedIds(new Set());
    setAllFailed(false);
    setError(false);
    fetchLiveVideos();
  };

  const getNetworkIndicator = () => {
    switch (networkQuality) {
      case 'good': return { color: 'bg-green-500', text: 'Good Connection' };
      case 'fair': return { color: 'bg-yellow-500', text: 'Fair Connection' };
      case 'poor': return { color: 'bg-orange-500', text: 'Poor Connection' };
      case 'offline': return { color: 'bg-red-500', text: 'Offline' };
      default: return { color: 'bg-gray-500', text: 'Unknown' };
    }
  };

  const network = getNetworkIndicator();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 text-sm">Loading live stream...</p>
        </div>
      </div>
    );
  }

  if (error || tvList.length === 0 || allFailed) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center overflow-y-auto">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center">
            <Tv className="w-8 h-8 text-white/40" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Stream Offline</h2>
          <p className="text-white/60 text-xs mb-4">
            {allFailed
              ? 'All streams failed to play. Please check back later.'
              : 'The live stream is currently offline. Please check back later.'}
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

  // ===== Reusable UI blocks =====
  const LiveBadge = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600/90 backdrop-blur-sm">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
      <span className="text-[10px] font-bold text-white">LIVE</span>
    </div>
  );

  const NetworkIndicator = (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${network.color} animate-pulse`}></div>
      <span className="text-[10px] text-white/40">{network.text}</span>
      {networkQuality === 'offline' ? (
        <WifiOff className="w-3 h-3 text-red-400" />
      ) : (
        <Wifi
          className={`w-3 h-3 ${
            network.color === 'bg-green-500'
              ? 'text-green-400'
              : network.color === 'bg-yellow-500'
              ? 'text-yellow-400'
              : 'text-orange-400'
          }`}
        />
      )}
    </div>
  );

  const VideoPlayer = (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg w-full"
    >
      <div className="relative" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          {tvList.map((item, index) => {
            const isActive = index === currentIndex;
            const isYT = isYouTubeUrl(item.url);
            const isFailed = failedIds.has(item.id);
            if (isFailed) return null;

            return (
              <div
                key={item.id}
                className="absolute inset-0 transition-opacity ease-in-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 10 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transitionDuration: `${FADE_DURATION}ms`,
                }}
              >
                {isYT ? (
                  <iframe
                    ref={(el) => {
                      if (el) iframeRefs.current.set(item.id, el);
                      else iframeRefs.current.delete(item.id);
                    }}
                    src={getYouTubeEmbedUrl(item.url, isMuted)}
                    onLoad={(e) => isActive && handleIframeLoad(e.target)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Live Stream ${index + 1}`}
                  />
                ) : (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(item.id, el);
                      else videoRefs.current.delete(item.id);
                    }}
                    src={item.url}
                    className="w-full h-full object-contain bg-black"
                    muted={isMuted}
                    playsInline
                    preload={isActive ? 'auto' : 'metadata'}
                    crossOrigin="anonymous"
                    onEnded={isActive ? handleVideoEnded : undefined}
                    onError={isActive ? () => handleVideoError(item.id) : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom controls — fades with chrome */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-20 transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-white" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white" />
              )}
            </button>

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

            {tvList.length > 1 && (
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Skip to next"
              >
                <SkipForward className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

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
    </div>
  );

  // ===== MOBILE LAYOUT (header BELOW the video) =====
  if (!isDesktop) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
        <div className="px-3 py-3">
          {/* Video first */}
          {VideoPlayer}

          {/* Header BELOW the video — fades with chrome */}
          <div
            className={`mt-3 flex items-center justify-between transition-opacity duration-500 ${
              chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Tv className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <p className="text-xs text-orange-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                LIVE NOW
              </p>
            </div>
            {NetworkIndicator}
          </div>
        </div>
      </div>
    );
  }

  // ===== DESKTOP LAYOUT (video + sidebar shifted down) =====
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-5xl flex gap-5 items-start">
          {/* Video column */}
          <div className="flex-1 min-w-0">
            {VideoPlayer}
          </div>

          {/* Sidebar — shifted downward (below middle) */}
          <aside
            className={`w-64 flex-shrink-0 transition-all duration-500 pt-24 ${
              chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 backdrop-blur-sm">
              {/* Live status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Tv className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-orange-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    LIVE NOW
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">WhoWin Live TV</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10"></div>

              {/* Network */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Connection
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${network.color} animate-pulse`}></div>
                  <span className="text-xs text-white/70">{network.text}</span>
                  {networkQuality === 'offline' ? (
                    <WifiOff className="w-3.5 h-3.5 text-red-400 ml-auto" />
                  ) : (
                    <Wifi
                      className={`w-3.5 h-3.5 ml-auto ${
                        network.color === 'bg-green-500'
                          ? 'text-green-400'
                          : network.color === 'bg-yellow-500'
                          ? 'text-yellow-400'
                          : 'text-orange-400'
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Tip */}
              <div className="border-t border-white/10 pt-3">
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Hover over the video to reveal controls. They'll hide after a few seconds.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}