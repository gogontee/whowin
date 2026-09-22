// components/HowToVote.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HelpCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronRight,
  Heart,
  Gift,
  CreditCard,
  Share2,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * HowToVote
 * ---------
 * A dismissable modal that shows a quick tutorial explaining how to vote.
 *
 * Props:
 *   - isOpen: boolean         → controls visibility
 *   - onClose: () => void     → called when the user closes the modal
 *   - candidateName?: string  → optional display name (shows in the intro)
 *   - videoUrl?: string       → optional override URL. If not provided, the
 *                               component reads `how_to_vote_video` from the
 *                               `who_win` table (id = 1). Supports both
 *                               YouTube links and direct MP4/WEBM files.
 *   - onVoteNow?: () => void  → optional. If provided, a "Vote Now" button is
 *                               shown at the bottom that calls this.
 */
export default function HowToVote({
  isOpen,
  onClose,
  candidateName = '',
  videoUrl: videoUrlProp = null,
  onVoteNow = null
}) {
  const [videoUrl, setVideoUrl] = useState(videoUrlProp);
  const [isYouTube, setIsYouTube] = useState(false);
  const [videoLoading, setVideoLoading] = useState(!videoUrlProp && isOpen);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // ============================================================
  // Detect YouTube vs direct file URL
  // ============================================================
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';

    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1]?.split('?')[0];
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`
      : url;
  };

  const detectProvider = (url) => {
    if (!url) return false;
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be')
    );
  };

  // ============================================================
  // Fetch the tutorial video URL from who_win table (if not passed as prop)
  // ============================================================
  useEffect(() => {
    if (videoUrlProp) {
      setVideoUrl(videoUrlProp);
      setIsYouTube(detectProvider(videoUrlProp));
      setVideoLoading(false);
      return;
    }

    if (!isOpen) return;

    let isMounted = true;
    setVideoLoading(true);

    const fetchVideoUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('who_win')
          .select('how_to_vote_video')
          .eq('id', 1)
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data?.how_to_vote_video) {
          setVideoUrl(data.how_to_vote_video);
          setIsYouTube(detectProvider(data.how_to_vote_video));
        } else {
          // No video configured → fall back to the step guide only
          setVideoUrl(null);
        }
      } catch (err) {
        console.warn('Could not fetch how-to-vote video:', err?.message || err);
        if (isMounted) setVideoUrl(null);
      } finally {
        if (isMounted) setVideoLoading(false);
      }
    };

    fetchVideoUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, videoUrlProp]);

  // Reset video UI state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setVideoError(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  // ============================================================
  // Native <video> controls
  // ============================================================
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ============================================================
  // Steps fallback (shown when there's no video)
  // ============================================================
  const steps = [
    {
      icon: Heart,
      title: 'Tap Vote Now',
      desc: `Hit the Vote Now button on ${candidateName ? candidateName.toUpperCase() : "the candidate's"} card.`
    },
    {
      icon: CreditCard,
      title: 'Choose votes & payment',
      desc: 'Pick how many votes you want (50, 100, 300, or a custom amount), then select NGN (Paystack) or USD (PayPal).'
    },
    {
      icon: Gift,
      title: 'Or send a gift',
      desc: 'Prefer to support with a gift? Tap Send Gift and pick from 🌹 flowers, 👑 crowns, 🏆 trophies, and more.'
    },
    {
      icon: Share2,
      title: 'Share the love',
      desc: 'Use the share bar to copy the link or post to WhatsApp, Facebook, or Instagram and get your friends voting too.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-gradient-to-r from-[#C58B2A]/10 to-yellow-500/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#C58B2A]/20 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-[#C58B2A]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    How To Vote
                  </h3>
                  {candidateName && (
                    <p className="text-[10px] text-white/50 truncate">
                      For {candidateName.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* ===== Scrollable body ===== */}
            <div className="flex-1 overflow-y-auto">

              {/* --- Video area --- */}
              {videoLoading ? (
                <div className="w-full aspect-video bg-black/60 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-[#C58B2A] animate-spin" />
                </div>
              ) : videoUrl && !videoError ? (
                <div
                  ref={containerRef}
                  className="relative w-full aspect-video bg-black"
                >
                  {isYouTube ? (
                    <iframe
                      src={getYouTubeEmbedUrl(videoUrl)}
                      title="How To Vote"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain bg-black"
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setVideoError(true)}
                      />

                      {/* Custom controls */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={togglePlay}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white" fill="white" />
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={toggleMute}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              aria-label={isMuted ? 'Unmute' : 'Mute'}
                            >
                              {isMuted ? (
                                <VolumeX className="w-4 h-4 text-white" />
                              ) : (
                                <Volume2 className="w-4 h-4 text-white" />
                              )}
                            </button>
                            <button
                              onClick={toggleFullscreen}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              aria-label="Fullscreen"
                            >
                              <Maximize className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {/* --- Intro text --- */}
              <div className="p-5 border-b border-white/10">
                <h4 className="text-sm font-bold text-white mb-1">
                  Voting is simple
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Follow the steps below to cast your vote and support
                  {candidateName ? ` ${candidateName.toUpperCase()}` : ' your favourite candidate'}.
                </p>
              </div>

              {/* --- Steps --- */}
              <div className="p-5 space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C58B2A]/15 border border-[#C58B2A]/30 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-4 h-4 text-[#C58B2A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-[#C58B2A]/70 uppercase tracking-wider">
                          Step {index + 1}
                        </span>
                      </div>
                      <h5 className="text-sm font-semibold text-white mb-1">
                        {step.title}
                      </h5>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== Footer ===== */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex-shrink-0">
              {onVoteNow ? (
                <button
                  onClick={() => {
                    onClose?.();
                    onVoteNow();
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  Vote Now
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Got it
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}