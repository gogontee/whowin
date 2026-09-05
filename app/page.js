// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Hero from '../components/Home/Hero';
import Stats from '../components/Home/Stats';
import TopCandidates from '../components/Home/TopCandidates';
import HomeFeaturedPost from '../components/Home/FeaturedPost';
import FeaturedPost from '../components/FeaturedPost';
import TopNews from '../components/Home/TopNews';
import { createBrowserClient } from '@supabase/ssr';

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

  const FALLBACK_DESCRIPTION = `WhoWin is Africa's premier celebrity reality show where stars compete in challenges, showcase their talents, and battle for the ultimate crown. From intense competitions to unforgettable moments, witness your favorite celebrities go head-to-head in the most thrilling entertainment spectacle on the continent.`;

  const FALLBACK_QUICK_TIPS = 'STRATEGY || ALLIANCE || COMPETITIVENESS';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkContent = async () => {
      try {
        // Fetch short description and quick tips from about_meta
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
          if (aboutData?.short_description) {
            setShortDescription(aboutData.short_description);
          } else {
            setShortDescription(FALLBACK_DESCRIPTION);
          }
          
          if (aboutData?.quick_tips) {
            setQuickTips(aboutData.quick_tips);
          } else {
            setQuickTips(FALLBACK_QUICK_TIPS);
          }
        }

        // Check if user is authenticated and get profile
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user || null);

        if (user) {
          // Fetch user profile to get role
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

        // Check if there are any active and verified candidates
        const { data: candidates, error: candidatesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_status', 'active')
          .eq('verification_level', 'fully_verified')
          .not('username', 'is', null)
          .limit(1);

        if (candidatesError) {
          console.warn('Error checking candidates:', candidatesError.message);
          setHasCandidates(false);
        } else {
          setHasCandidates(candidates && candidates.length > 0);
        }

        // Check if there is any content in who_win carousel or tv columns
        const { data: whoWin, error: whoWinError } = await supabase
          .from('who_win')
          .select('carousel, tv')
          .eq('id', 1)
          .single();

        if (whoWinError) {
          console.warn('Error checking who_win content:', whoWinError.message);
          setHasHomeFeaturedContent(false);
        } else {
          const hasCarousel = whoWin?.carousel && Array.isArray(whoWin.carousel) && whoWin.carousel.length > 0;
          const hasTv = whoWin?.tv && Array.isArray(whoWin.tv) && whoWin.tv.length > 0;
          setHasHomeFeaturedContent(hasCarousel || hasTv);
        }

      } catch (error) {
        console.error('Error checking content:', error);
        setHasCandidates(false);
        setHasHomeFeaturedContent(false);
        setShortDescription(FALLBACK_DESCRIPTION);
        setQuickTips(FALLBACK_QUICK_TIPS);
      } finally {
        setLoading(false);
      }
    };

    checkContent();
  }, [supabase]);

  const handleRegisterClick = () => {
    router.push('/auth/signup');
  };

  const handleLearnMoreClick = () => {
    router.push('/about');
  };

  const handleMyProfileClick = () => {
    if (userProfile?.username) {
      router.push(`/${userProfile.username}`);
    } else {
      router.push('/profile');
    }
  };

  const handleLearnAboutShowClick = () => {
    router.push('/about');
  };

  // Parse quick tips from string format: "STRATEGY || ALLIANCE || COMPETITIVENESS"
  const getQuickTipsArray = () => {
    if (!quickTips) return [];
    return quickTips.split('||').map(tip => tip.trim());
  };

  // Determine which CTA to show
  const renderCTA = () => {
    // If auth not checked yet, show nothing
    if (!authChecked) return null;

    // If user is authenticated
    if (currentUser && userProfile) {
      // If role is 'user' - show user CTA
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

      // If role is 'admin' or 'fan' - show nothing
      if (userProfile.role === 'admin' || userProfile.role === 'fan') {
        return null;
      }

      // Fallback for other roles - show nothing
      return null;
    }

    // If user is not authenticated - show guest CTA
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
      
      {/* About WhoWin Show Text Section - Dynamically from about_meta */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            {shortDescription}
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 mx-auto mt-2 rounded-full"></div>
        </div>
      </div>
      
      {/* FeaturedPost from components/FeaturedPost - Always renders */}
      <FeaturedPost />
      
      {/* Quick Tips Section - Full Width Golden Bar */}
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

      {/* Only render TopCandidates if there are candidates */}
      {hasCandidates && <TopCandidates />}
      
      {/* Only render HomeFeaturedPost if there is content in who_win carousel or tv */}
      {hasHomeFeaturedContent && <HomeFeaturedPost />}
      
      {/* Footer CTA - Conditional based on auth and role */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {renderCTA()}
      </div>
      
      {/* TopNews - Always renders last */}
      <TopNews />
    </div>
  );
}