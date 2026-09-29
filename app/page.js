// app/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Hero from '../components/Home/Hero';
import Stats from '../components/Home/Stats';
import TopCandidates from '../components/Home/TopCandidates';
import HomeFeaturedPost from '../components/Home/FeaturedPost';
import FeaturedPost from '../components/FeaturedPost';
import ContentScroll from '../components/ContentScroll';
import TopNews from '../components/Home/TopNews';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const [hasCandidates, setHasCandidates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [quickTips, setQuickTips] = useState('');
  const [showTopCandidate, setShowTopCandidate] = useState(false);

  // ===== Welcome onboarding state (guests only) =====
  // The modal shows once per session for guests. Tapping "Tap Here to
  // Continue" is a genuine user gesture → audio is unlocked and voice 1
  // plays immediately.
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // Refs to the hidden background audio elements
  const bgAudioRef = useRef(null);
  const bgAudio2Ref = useRef(null);

  // Guard refs
  const hasPlayedRef = useRef(false);
  const secondVoiceTimerRef = useRef(null);
  const registerClickedRef = useRef(false);
  const voice1EndedRef = useRef(false);
  // Tracks whether the user consented to audio via the welcome modal
  const audioConsentedRef = useRef(false);

  const FALLBACK_DESCRIPTION = `WhoWin is Africa's premier celebrity reality show where stars compete in challenges, showcase their talents, and battle for the ultimate crown. From intense competitions to unforgettable moments, witness your favorite celebrities go head-to-head in the most thrilling entertainment spectacle on the continent.`;

  const FALLBACK_QUICK_TIPS = 'STRATEGY || ALLIANCE || COMPETITIVENESS';

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      if (secondVoiceTimerRef.current) {
        clearTimeout(secondVoiceTimerRef.current);
        secondVoiceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkContent = async () => {
      try {
        const { data: aboutData, error: aboutError } = await supabase
          .from('about_meta')
          .select('short_description, quick_tips')
          .eq('id', 1)
          .maybeSingle();

        if (aboutError) {
          console.warn('Error fetching about data:', aboutError.message);
          setShortDescription(FALLBACK_DESCRIPTION);
          setQuickTips(FALLBACK_QUICK_TIPS);
        } else {
          setShortDescription(aboutData?.short_description || FALLBACK_DESCRIPTION);
          setQuickTips(aboutData?.quick_tips || FALLBACK_QUICK_TIPS);
        }

        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user || null);

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, username')
            .eq('id', user.id)
            .single();

          if (!profileError && profile) {
            setUserProfile(profile);
          }
        }
        setAuthChecked(true);

        const { data: candidates, error: candidatesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_status', 'active')
          .eq('verification_level', 'fully_verified')
          .not('username', 'is', null)
          .limit(1);

        if (candidatesError) {
          setHasCandidates(false);
        } else {
          setHasCandidates(candidates && candidates.length > 0);
        }

        const { data: whoWin, error: whoWinError } = await supabase
          .from('who_win')
          .select('show_top_candidate')
          .eq('id', 1)
          .single();

        if (whoWinError) {
          setShowTopCandidate(false);
        } else {
          setShowTopCandidate(whoWin?.show_top_candidate === true);
        }

      } catch (error) {
        console.error('Error checking content:', error);
        setHasCandidates(false);
        setShortDescription(FALLBACK_DESCRIPTION);
        setQuickTips(FALLBACK_QUICK_TIPS);
        setShowTopCandidate(false);
      } finally {
        setLoading(false);
      }
    };

    checkContent();
  }, [supabase]);

  // ============================================================
  // WELCOME MODAL TRIGGER (GUESTS ONLY, ONCE PER SESSION)
  // - Runs after loading + auth checks complete.
  // - Only shows for guests (no currentUser).
  // - Only shows once per browser session (sessionStorage flag).
  // ============================================================
  useEffect(() => {
    if (loading) return;
    if (!authChecked) return;
    if (currentUser) return; // logged-in users never see it and never get voices

    const sessionKey = 'whowin_welcome_session';
    const answered = sessionStorage.getItem(sessionKey);

    if (answered === 'yes') {
      // Already consented this session — no modal, but voices CAN play
      // when the user interacts. We leave audioConsentedRef false so the
      // existing "resume on first interaction" logic below still runs.
      setShowWelcomeModal(false);
      setWelcomeDismissed(true);
    } else if (answered === 'no') {
      // User declined this session — no modal, no voices.
      audioConsentedRef.current = false;
      setShowWelcomeModal(false);
      setWelcomeDismissed(true);
    } else {
      // First visit this session — show the modal.
      setShowWelcomeModal(true);
    }
  }, [loading, authChecked, currentUser]);

  // ============================================================
  // Background audio sequence (GUESTS + CONSENT ONLY)
  // - Voice 1 attempts to play when user taps "Tap Here to Continue"
  //   on the welcome modal (a fresh user gesture → audio is unlocked).
  // - When voice 1 ends, start an 8s timer → play voice 2.
  // - If Register is clicked at any point, cancel voice 2.
  // - If the user declines, no voices play at all this session.
  // ============================================================
  useEffect(() => {
    if (!authChecked) return;
    if (currentUser) return;
    if (hasPlayedRef.current) return;
    if (!audioConsentedRef.current) return; // only after user consents

    const v1 = bgAudioRef.current;
    const v2 = bgAudio2Ref.current;
    if (!v1 || !v2) return;

    hasPlayedRef.current = true;

    // Force the browser to begin buffering both files right away.
    v1.volume = 0.8;
    v2.volume = 0.8;
    try { v1.load(); } catch (e) {}
    try { v2.load(); } catch (e) {}

    // -------- Voice 2 scheduler --------
    const scheduleVoice2 = () => {
      if (registerClickedRef.current) return;
      if (voice1EndedRef.current) return;
      voice1EndedRef.current = true;

      if (secondVoiceTimerRef.current) {
        clearTimeout(secondVoiceTimerRef.current);
      }
      secondVoiceTimerRef.current = setTimeout(() => {
        if (registerClickedRef.current) return;
        if (!bgAudio2Ref.current) return;
        bgAudio2Ref.current.volume = 0.8;
        bgAudio2Ref.current.play().catch(() => {});
      }, 8000);
    };

    const handleVoice1Ended = () => {
      scheduleVoice2();
    };

    const tryPlayVoice1 = () => {
      const p = v1.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          // Playing — 'ended' will fire naturally.
        }).catch(() => {
          attachResumeListeners();
        });
      }
    };

    // Fallback in case the tap didn't fully unlock autoplay
    // (rare, but keeps the experience robust).
    const resumeOnInteraction = () => {
      removeResumeListeners();
      if (v1.ended || voice1EndedRef.current) {
        scheduleVoice2();
        return;
      }
      if (!v1.paused && v1.currentTime > 0) {
        return;
      }
      v1.play().catch(() => {});
    };

    const attachResumeListeners = () => {
      document.addEventListener('pointerdown', resumeOnInteraction, { once: true, passive: true });
      document.addEventListener('keydown', resumeOnInteraction, { once: true });
      document.addEventListener('touchstart', resumeOnInteraction, { once: true, passive: true });
      document.addEventListener('click', resumeOnInteraction, { once: true, passive: true });
    };

    const removeResumeListeners = () => {
      document.removeEventListener('pointerdown', resumeOnInteraction);
      document.removeEventListener('keydown', resumeOnInteraction);
      document.removeEventListener('touchstart', resumeOnInteraction);
      document.removeEventListener('click', resumeOnInteraction);
    };

    v1.addEventListener('ended', handleVoice1Ended);

    tryPlayVoice1();

    return () => {
      v1.removeEventListener('ended', handleVoice1Ended);
      removeResumeListeners();
      if (secondVoiceTimerRef.current) {
        clearTimeout(secondVoiceTimerRef.current);
        secondVoiceTimerRef.current = null;
      }
    };
  }, [authChecked, currentUser, welcomeDismissed]);

  // ===== Welcome modal handler — single "Tap Here to Continue" =====
  const handleWelcomeContinue = () => {
    // Persist for the session — no re-showing.
    sessionStorage.setItem('whowin_welcome_session', 'yes');
    audioConsentedRef.current = true;
    setShowWelcomeModal(false);
    setWelcomeDismissed(true);
    // The audio effect above kicks in because welcomeDismissed changes.
    // Because the tap is a genuine user gesture, the browser will allow
    // the .play() call immediately.
  };

  // ===== Cancel second voice if user clicks Register =====
  const cancelSecondVoice = () => {
    registerClickedRef.current = true;
    if (secondVoiceTimerRef.current) {
      clearTimeout(secondVoiceTimerRef.current);
      secondVoiceTimerRef.current = null;
    }
    if (bgAudio2Ref.current) {
      try {
        bgAudio2Ref.current.pause();
        bgAudio2Ref.current.currentTime = 0;
      } catch (e) {}
    }
  };

  const handleRegisterClick = () => {
    cancelSecondVoice();
    router.push('/auth/signup');
  };

  const handleLearnMoreClick = () => router.push('/about');
  const handleMyProfileClick = () => {
    if (userProfile?.username) {
      router.push(`/${userProfile.username}`);
    } else {
      router.push('/profile');
    }
  };
  const handleLearnAboutShowClick = () => router.push('/about');
  const handleViewSeason1 = () => router.push('/previous-seasons');

  const getQuickTipsArray = () => {
    if (!quickTips) return [];
    return quickTips.split('||').map(tip => tip.trim());
  };

  const renderCTA = () => {
    if (!authChecked) return null;

    if (currentUser && userProfile) {
      if (userProfile.role === 'user') {
        return (
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-5 md:p-7 text-center border border-white/10">
            <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">
              Your Journey to Who Wins 2026 Has Begun!
            </h3>
            <p className="text-white/70 text-sm md:text-base mb-4 md:mb-6 max-w-2xl mx-auto">
              Make sure your candidate profile is complete and ready for the next stage.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
              <button
                onClick={handleMyProfileClick}
                className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-green-500 hover:to-emerald-400 text-gray-900 hover:text-white font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                My Profile
              </button>
              <button
                onClick={handleLearnAboutShowClick}
                className="bg-transparent hover:bg-white/10 text-white font-semibold px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-sm border border-white/30 hover:border-white/50 transition-all duration-300"
              >
                Learn About the Show
              </button>
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-5 md:p-7 text-center border border-white/10">
        <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">
          Want to Be a Contestant on Who Win?
        </h3>
        <p className="text-white/70 text-sm md:text-base mb-4 md:mb-6 max-w-2xl mx-auto">
          Find out how to become a candidate on Who Wins Reality Show.
          Take the first step towards your aspiration.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <button
            onClick={handleRegisterClick}
            className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-green-500 hover:to-emerald-400 text-gray-900 hover:text-white font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Register Here
          </button>
          <Link
            href="/about"
            className="bg-transparent hover:bg-white/10 text-white font-semibold px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-sm border border-white/30 hover:border-white/50 transition-all duration-300 inline-flex items-center justify-center"
          >
            LEARN MORE
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <Hero />
        <Stats />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const quickTipsArray = getQuickTipsArray();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Hidden background audio — always mounted for guests */}
      {!currentUser && (
        <>
          <audio
            ref={bgAudioRef}
            src="/homepagevoice.MP3"
            preload="auto"
            playsInline
            loop={false}
          />
          <audio
            ref={bgAudio2Ref}
            src="/homepagevoice2.MP3"
            preload="auto"
            playsInline
            loop={false}
          />
        </>
      )}

      {/* ===== WELCOME ONBOARDING MODAL (GUESTS, ONCE PER SESSION) ===== */}
      <AnimatePresence>
        {showWelcomeModal && !currentUser && (
          <motion.div
            key="welcome-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-md rounded-2xl border border-[#C58B2A]/30 bg-gradient-to-br from-gray-900 to-black p-6 md:p-7 shadow-2xl shadow-[#C58B2A]/10 text-center"
            >
              {/* Logo */}
              <div className="relative w-28 h-16 md:w-32 md:h-20 mx-auto mb-4">
                <Image
                  src="/logo.png"
                  alt="WhoWin Logo"
                  fill
                  sizes="(max-width: 768px) 112px, 128px"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Heading */}
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                Welcome to Who Wins
              </h2>

              {/* Button */}
              <div className="flex justify-center mt-5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWelcomeContinue}
                  className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-bold text-sm transition-all hover:shadow-lg hover:shadow-[#C58B2A]/30"
                >
                  Tap Here to Continue
                </motion.button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Hero />
      <Stats />

      {/* About WhoWin Show Text Section */}
      <div className="container mx-auto px-4 pt-1 pb-2 md:pt-2 md:pb-3">
        <div className="max-w-3xl mx-auto text-center">
          {/* Metallic white/silver rim — FORCED inline styles */}
          <div
            className="relative inline-block rounded-2xl p-[2px]"
            style={{
              background: 'linear-gradient(135deg, #555555 0%, #999999 20%, #e0e0e0 40%, #ffffff 50%, #e0e0e0 60%, #999999 80%, #555555 100%)',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              className="rounded-2xl px-5 py-5 md:px-8 md:py-6"
              style={{
                background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(0, 0, 0, 0.95))',
                backdropFilter: 'blur(4px)',
              }}
            >
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                {shortDescription}
              </p>

              {/* Small compact Learn More button */}
              <div className="mt-3 md:mt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-xs transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #6b6b6b 0%, #a8a8a8 20%, #e8e8e8 40%, #ffffff 50%, #e8e8e8 60%, #a8a8a8 80%, #6b6b6b 100%)',
                    color: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  Learn More
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
          <div
            className="w-12 h-0.5 mx-auto mt-3 rounded-full"
            style={{
              background: 'linear-gradient(to right, #999999 0%, #ffffff 50%, #999999 100%)',
            }}
          ></div>
        </div>
      </div>

      <ContentScroll />

      <FeaturedPost />

      {/* Quick Tips Section */}
      {quickTipsArray.length > 0 && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-green-400 to-amber-500 py-2.5 md:py-3 shadow-lg shadow-yellow-500/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 md:gap-10">
              {quickTipsArray.map((tip, index) => (
                <div key={index} className="flex items-center gap-6 md:gap-10">
                  <span className="text-white font-bold text-xs md:text-sm tracking-wider uppercase whitespace-nowrap">
                    {tip}
                  </span>
                  {index < quickTipsArray.length - 1 && (
                    <span className="text-white/30 text-lg">|</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Candidates — only when show_top_candidate is true AND candidates exist */}
      {hasCandidates && showTopCandidate && <TopCandidates />}

      {/* Featured Post — always rendered, component self-hides if empty */}
      <HomeFeaturedPost />

      {/* Footer CTA */}
      <div className="container mx-auto px-4 pt-2 pb-4 md:pt-3 md:pb-6">
        {renderCTA()}
      </div>

      {/* TopNews */}
      <TopNews />

      {/* ===== Season 1 Highlight Button ===== */}
      <section className="container mx-auto px-4 pt-2 pb-8 md:pt-4 md:pb-12">
        <div className="flex justify-center">
          <button
            onClick={handleViewSeason1}
            className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-green-500 hover:to-emerald-400 text-gray-900 hover:text-white font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <span>View Season 1 Highlight</span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}