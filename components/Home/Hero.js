// components/Home/Hero.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Share2 } from 'lucide-react';

const Hero = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback slides - using local banner images
  const FALLBACK_SLIDES = [
    {
      id: 1,
      image: '/banner1.jpeg'
    },
    {
      id: 2,
      image: '/banner2.jpeg'
    },
    {
      id: 3,
      image: '/banner3.jpeg'
    }
  ];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch hero section images from who_win table
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data, error } = await supabase
          .from('who_win')
          .select('hero_section')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching hero images:', error.message);
          setSlides(FALLBACK_SLIDES);
          setLoading(false);
          return;
        }

        if (data?.hero_section && Array.isArray(data.hero_section) && data.hero_section.length > 0) {
          // Map database images to slide format
          const mappedSlides = data.hero_section.map((item, index) => ({
            id: index + 1,
            image: item.url
          }));
          setSlides(mappedSlides);
        } else {
          // No images in database, use fallback
          setSlides(FALLBACK_SLIDES);
        }
      } catch (error) {
        console.error('Error fetching hero images:', error);
        setSlides(FALLBACK_SLIDES);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroImages();
  }, []);

  // Get current user and profile
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, full_name')
          .eq('id', user.id)
          .maybeSingle();
        
        setUserProfile(profile);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        setUserProfile(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);
  
  // Auto-rotate slides
  useEffect(() => {
    if (slides.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Handle challenge - navigate to challenge page
  const handleChallenge = () => {
    if (userProfile?.username) {
      router.push(`/challenge/${userProfile.username}`);
    } else {
      // Fallback - if no username, go to generic challenge page
      router.push('/challenge');
    }
  };

  // Handle register click
  const handleRegister = () => {
    router.push('/auth/signup');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-[46vh] md:h-[46vh] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 animate-pulse"></div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - 5:2.3 ratio (46vh) */}
      <div className="relative w-full h-[46vh] md:h-[46vh] overflow-hidden bg-gray-900">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background image only */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${slide.image})`
              }}
            ></div>
          </div>
        ))}
        
        {/* Optional dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-gray-900/30 z-5"></div>
        
        {/* Slide indicator dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentSlide 
                  ? 'bg-orange-500 w-6' 
                  : 'bg-gray-300 hover:bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* CTA Button - Desktop position (bottom-left) */}
        <div className="hidden md:block absolute bottom-4 left-4 z-20">
          {user ? (
            <button 
              onClick={handleChallenge}
              className="bg-gradient-to-r from-amber-500 via-green-400 to-amber-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Challenge Your Friend Into the Contest
            </button>
          ) : (
            <button 
              onClick={handleRegister}
              className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-green-500 hover:to-emerald-400 text-gray-900 hover:text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              REGISTER NOW
            </button>
          )}
        </div>
      </div>
      
      {/* CTA Button - Mobile (full width with padding) */}
      <div className="md:hidden w-full px-4 mt-4">
        {user ? (
          <button 
            onClick={handleChallenge}
            className="w-full bg-gradient-to-r from-amber-500 via-green-400 to-amber-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Challenge Your Friend Into the Contest
          </button>
        ) : (
          <button 
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-green-500 hover:to-emerald-400 text-gray-900 hover:text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          >
            REGISTER NOW
          </button>
        )}
      </div>
    </>
  );
};

export default Hero;