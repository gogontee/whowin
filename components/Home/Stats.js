// components/Home/Stats.js
'use client';

import { Users, Calendar, Home, Trophy, TrendingUp, Globe, Eye, Target, FileText, Settings, Phone, MessageCircle, Heart, Star, Zap, Coffee, Camera, Music, Award, Clock, DollarSign, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Icon mapping for dynamic icons
const iconMap = {
  'Users': Users,
  'Calendar': Calendar,
  'Home': Home,
  'Trophy': Trophy,
  'TrendingUp': TrendingUp,
  'Globe': Globe,
  'Eye': Eye,
  'Target': Target,
  'FileText': FileText,
  'Settings': Settings,
  'Phone': Phone,
  'MessageCircle': MessageCircle,
  'Heart': Heart,
  'Star': Star,
  'Zap': Zap,
  'Coffee': Coffee,
  'Camera': Camera,
  'Music': Music,
  'Award': Award,
  'Clock': Clock,
  'DollarSign': DollarSign,
  'Shield': Shield,
};

// Default fallback stats (hardcoded)
const FALLBACK_STATS = [
  { 
    value: '45', 
    label: 'Housemates',
    icon: 'Users',
    color: 'text-blue-400',
    iconColor: 'text-blue-400'
  },
  { 
    value: '28', 
    label: 'Days',
    icon: 'Calendar',
    color: 'text-purple-400',
    iconColor: 'text-purple-400'
  },
  { 
    value: '1', 
    label: 'House',
    icon: 'Home',
    color: 'text-emerald-400',
    iconColor: 'text-emerald-400'
  },
  { 
    value: '₦19M', 
    label: 'Worth of Prizes',
    icon: 'Trophy',
    color: 'text-amber-400',
    iconColor: 'text-amber-400'
  },
];

// Color mapping for stats
const getStatColors = (index) => {
  const colors = [
    { color: 'text-blue-400', iconColor: 'text-blue-400' },
    { color: 'text-purple-400', iconColor: 'text-purple-400' },
    { color: 'text-emerald-400', iconColor: 'text-emerald-400' },
    { color: 'text-amber-400', iconColor: 'text-amber-400' },
    { color: 'text-pink-400', iconColor: 'text-pink-400' },
    { color: 'text-cyan-400', iconColor: 'text-cyan-400' },
    { color: 'text-rose-400', iconColor: 'text-rose-400' },
    { color: 'text-indigo-400', iconColor: 'text-indigo-400' },
    { color: 'text-orange-400', iconColor: 'text-orange-400' },
    { color: 'text-green-400', iconColor: 'text-green-400' },
    { color: 'text-yellow-400', iconColor: 'text-yellow-400' },
    { color: 'text-red-400', iconColor: 'text-red-400' },
  ];
  return colors[index % colors.length];
};

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching stats from about_meta...');
      
      const { data, error } = await supabase
        .from('about_meta')
        .select('stats')
        .eq('id', 1)
        .maybeSingle();

      console.log('Stats data:', data);
      console.log('Stats error:', error);

      // Check for error or no data
      if (error) {
        console.error('Error fetching stats:', error.message);
        // Use fallback stats
        setStats(FALLBACK_STATS);
        setLoading(false);
        return;
      }

      // Check if stats exist and is a valid array
      if (data && data.stats && Array.isArray(data.stats) && data.stats.length > 0) {
        console.log('Stats found in database:', data.stats);
        
        // Map database stats to component format
        const mappedStats = data.stats.map((stat, index) => {
          const colors = getStatColors(index);
          return {
            value: stat.value || '0',
            label: stat.label || 'Stat',
            icon: stat.icon || 'Users',
            color: colors.color,
            iconColor: colors.iconColor,
          };
        });
        setStats(mappedStats);
      } else {
        console.log('No stats in database, using fallback');
        setStats(FALLBACK_STATS);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(FALLBACK_STATS);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer for animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const sectionRef = useRef(null);

  // Loading skeleton
  if (loading) {
    return (
      <section 
        ref={sectionRef}
        className="container mx-auto px-3 md:px-6 py-2 md:py-3"
      >
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-2 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-around">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-full bg-white/5 border border-white/10">
                  <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-white/10 rounded animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <div className="h-4 md:h-5 w-12 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-2 w-8 bg-white/10 rounded animate-pulse mt-1"></div>
                </div>
                {index < 3 && (
                  <div className="hidden sm:block h-8 w-px bg-white/10 ml-1 md:ml-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={sectionRef}
      className="container mx-auto px-3 md:px-6 py-2 md:py-3"
    >
      {/* App-style stats bar */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-2 md:px-4 py-2 md:py-3">
        <div className="flex items-center justify-around">
          {stats.map((stat, index) => {
            // Get the actual icon component from the map
            const IconComponent = iconMap[stat.icon] || Users;
            const delay = index * 80;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-2 md:gap-3 transition-all duration-500 transform ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
                style={{ transitionDelay: `${delay}ms` }}
              >
                {/* Icon with circular background */}
                <div className={`p-1.5 md:p-2 rounded-full bg-white/5 border border-white/10 ${stat.iconColor}`}>
                  <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                
                {/* Value and Label */}
                <div className="flex flex-col">
                  <span className={`text-sm md:text-lg font-bold ${stat.color} leading-tight`}>
                    {stat.value}
                  </span>
                  <span className="text-white/40 text-[8px] md:text-[10px] font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>

                {/* Divider - except for last item */}
                {index < stats.length - 1 && (
                  <div className="hidden sm:block h-8 w-px bg-white/10 ml-1 md:ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;