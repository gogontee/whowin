// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Hero from '../components/Home/Hero';
import Stats from '../components/Home/Stats';
import TopCandidates from '../components/Home/TopCandidates';
import HomeFeaturedPost from '../components/Home/FeaturedPost';
import FeaturedPost from '../components/FeaturedPost';
import ContentScroll from '../components/ContentScroll';
import TopNews from '../components/Home/TopNews';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [hasCandidates, setHasCandidates] = useState(null);
  const [hasHomeFeaturedContent, setHasHomeFeaturedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [quickTips, setQuickTips] = useState('');
  const [season1Images, setSeason1Images] = useState([]);
  // Controls whether TopCandidates section renders (from who_win.show_top_candidate)
  const [showTopCandidate, setShowTopCandidate] = useState(false);

  const FALLBACK_DESCRIPTION = `WhoWin is Africa's premier celebrity reality show where stars compete in challenges, showcase their talents, and battle for the ultimate crown. From intense competitions to unforgettable moments, witness your favorite celebrities go head-to-head in the most thrilling entertainment spectacle on the continent.`;

  const FALLBACK_QUICK_TIPS = 'STRATEGY || ALLIANCE || COMPETITIVENESS';

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
          .select('carousel, tv, show_top_candidate')
          .eq('id', 1)
          .single();

        if (whoWinError) {
          setHasHomeFeaturedContent(false);
          setShowTopCandidate(false);
        } else {
          const hasCarousel = whoWin?.carousel && Array.isArray(whoWin.carousel) && whoWin.carousel.length > 0;
          const hasTv = whoWin?.tv && Array.isArray(whoWin.tv) && whoWin.tv.length > 0;
          setHasHomeFeaturedContent(hasCarousel || hasTv);

          // Only true when explicitly set to boolean true
          setShowTopCandidate(whoWin?.show_top_candidate === true);
        }

        const { data: catalogueData, error: catalogueError } = await supabase
          .from('catalogue')
          .select('id, image_url')
          .not('image_url', 'is', null)
          .limit(4);

        if (catalogueError) {
          setSeason1Images([]);
        } else {
          setSeason1Images(catalogueData || []);
        }

      } catch (error) {
        console.error('Error checking content:', error);
        setHasCandidates(false);
        setHasHomeFeaturedContent(false);
        setShortDescription(FALLBACK_DESCRIPTION);
        setQuickTips(FALLBACK_QUICK_TIPS);
        setSeason1Images([]);
        setShowTopCandidate(false);
      } finally {
        setLoading(false);
      }
    };

    checkContent();
  }, [supabase]);

  const handleRegisterClick = () => router.push('/auth/signup');
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
                className="bg-transparent hover:bg-white/10 text-white font-semibold px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm border border-white/30 hover:border-white/50 transition-all duration-300"
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
          <button
            onClick={handleLearnMoreClick}
            className="bg-transparent hover:bg-white/10 text-white font-semibold px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm border border-white/30 hover:border-white/50 transition-all duration-300"
          >
            LEARN MORE
          </button>
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
      <Hero />
      <Stats />

      {/* About WhoWin Show Text Section — trimmed */}
      <div className="container mx-auto px-4 pt-1 pb-2 md:pt-2 md:pb-3">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            {shortDescription}
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 mx-auto mt-2 rounded-full"></div>
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

      {hasHomeFeaturedContent && <HomeFeaturedPost />}

      {/* Footer CTA */}
      <div className="container mx-auto px-4 pt-2 pb-4 md:pt-3 md:pb-6">
        {renderCTA()}
      </div>

      {/* TopNews */}
      <TopNews />

      {/* ===== Season 1 Section ===== */}
      {season1Images.length > 0 && (
        <section className="container mx-auto px-4 pt-2 pb-8 md:pt-4 md:pb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <div className="text-orange-400 text-sm font-medium tracking-wider mb-1">
                PREVIOUS
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Season 1 Highlights
              </h2>
            </div>

            <button
              onClick={handleViewSeason1}
              className="hidden md:flex items-center gap-2 text-white/80 hover:text-white group"
            >
              <span className="text-xs font-medium">VIEW MORE FROM SEASON 1</span>
              <div className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {season1Images.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/10 hover:border-[#C58B2A]/50 transition-colors duration-300 group cursor-pointer"
                onClick={handleViewSeason1}
              >
                <Image
                  src={item.image_url}
                  alt="Season 1"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="md:hidden mt-4 flex justify-center">
            <button
              onClick={handleViewSeason1}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm font-medium transition-colors"
            >
              View More from Season 1
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}