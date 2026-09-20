// components/Home/Hero.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Hero = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  // NEW: track registration navigation in progress
  const [registering, setRegistering] = useState(false);

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

  // NEW: prefetch the signup route as soon as the Hero mounts
  // so navigation feels instant even on poor networks
  useEffect(() => {
    router.prefetch('/auth/signup');
    router.prefetch('/auth/login');
  }, [router]);

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
          const mappedSlides = data.hero_section.map((item, index) => ({
            id: index + 1,
            image: item.url
          }));
          setSlides(mappedSlides);
        } else {
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

  // Open the authenticated user's profile page
  const handleProfile = () => {
    if (userProfile?.username) {
      router.push(`/${userProfile.username}`);
    } else {
      router.push('/auth/login');
    }
  };

  // Handle register click
  // NEW: show instant loading state, disable button, then navigate.
  // The small timeout lets React paint the loading state first, so on
  // a slow network the user still sees immediate feedback.
  const handleRegister = () => {
    if (registering) return; // guard against double-click
    setRegistering(true);
    // Let the browser paint the loading state before we navigate
    setTimeout(() => {
      router.push('/auth/signup');
    }, 50);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-[30vh] md:h-[46vh] overflow-hidden bg-gray-900">
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
      {/* Hero Section - Mobile: 30vh, Desktop: 46vh */}
      <div className="relative w-full h-[30vh] md:h-[46vh] overflow-hidden bg-gray-900">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
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
              onClick={handleProfile}
              className="metallic-green font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              My profile Page
            </button>
          ) : (
            <button 
              onClick={handleRegister}
              disabled={registering}
              aria-busy={registering}
              className={`metallic-green font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 min-w-[150px] ${
                registering
                  ? 'opacity-70 cursor-wait pointer-events-none'
                  : 'hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {registering ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white font-extrabold">Loading…</span>
                </>
              ) : (
                <span className="text-white font-extrabold">Register Now</span>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* CTA Button - Mobile (full width with padding) */}
      <div className="md:hidden w-full px-4 mt-3">
        {user ? (
          <button 
            onClick={handleProfile}
            className="w-full metallic-green font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
          >
            My profile Page
          </button>
        ) : (
          <button 
            onClick={handleRegister}
            disabled={registering}
            aria-busy={registering}
            className={`w-full metallic-green font-bold py-3 rounded-xl shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
              registering
                ? 'opacity-70 cursor-wait pointer-events-none'
                : 'hover:shadow-xl'
            }`}
          >
            {registering ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-white" />
                <span className="text-white font-extrabold">Loading…</span>
              </>
            ) : (
              <span className="text-white font-extrabold">Register Now</span>
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default Hero;