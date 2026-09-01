// /components/profile/ProfileInfo.js
'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Phone,
  CheckCircle,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  Vote,
  Eye,
  User,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ProfileInfo({ 
  profile, 
  isOwner, 
  stats: initialStats
}) {
  const router = useRouter();
  const [liveStats, setLiveStats] = useState(initialStats);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check if user is admin AND is the page owner
  const isAdminAndOwner = profile?.role === 'admin' && isOwner === true;

  // Check if social icons should be shown
  const showSocialIcons = profile?.social_control === true;

  // Fetch vote stats from vote_transactions (only if not admin)
  useEffect(() => {
    if (profile?.id && !isAdminAndOwner) {
      fetchVoteStats();
    }
  }, [profile?.id, isAdminAndOwner]);

  // Set up real-time subscription for vote updates (only if not admin)
  useEffect(() => {
    if (!profile?.id || isAdminAndOwner) return;

    const subscription = supabase
      .channel(`votes-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_transactions',
          filter: `candidate_id=eq.${profile.id}`
        },
        () => {
          fetchVoteStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id, supabase, isAdminAndOwner]);

  const fetchVoteStats = async () => {
    try {
      const { data, error } = await supabase
        .from('vote_transactions')
        .select('votes')
        .eq('candidate_id', profile.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching vote stats:', error);
        setLiveStats(prev => ({
          ...prev,
          totalVotes: 0
        }));
      } else {
        const totalVotes = data?.reduce((sum, tx) => sum + (tx.votes || 0), 0) || 0;
        setLiveStats(prev => ({
          ...prev,
          totalVotes
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setLiveStats(prev => ({
        ...prev,
        totalVotes: 0
      }));
    }
  };

  // Update liveStats when initialStats changes
  useEffect(() => {
    setLiveStats(initialStats);
  }, [initialStats]);

  const handleAdminPanelClick = () => {
    router.push('/adminpannel');
  };

  // Format username: capitalize first letter
  const formatUsername = (username) => {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Format location: if social icons visible, show country first 3 letters + state full
  const formatLocation = () => {
    if (!profile.country && !profile.state) return null;
    
    if (showSocialIcons) {
      // Show country first 3 letters + state full
      const countryAbbr = profile.country ? profile.country.substring(0, 3).toUpperCase() : '';
      const stateFull = profile.state || '';
      return `${countryAbbr}${stateFull ? ', ' + stateFull : ''}`;
    } else {
      // Show full country and state
      return `${profile.country || ''}${profile.state ? ', ' + profile.state : ''}`;
    }
  };

  const locationDisplay = formatLocation();

  return (
    <div className="px-4">
      {/* Profile Details - Horizontal Layout */}
      <div className="flex flex-row flex-wrap items-center gap-2 md:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h1 className="!text-2xl font-bold text-white">
            @{formatUsername(profile.username)}
          </h1>
          {profile.verification_level === 'fully_verified' && (
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 fill-current" />
          )}
          {profile.role === 'celebrity' && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white text-[10px] md:text-xs rounded-full">
              Celebrity
            </span>
          )}
          {isAdminAndOwner && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] md:text-xs rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>

        {/* Location on same line with social icons */}
        <div className="flex items-center gap-2 md:gap-3">
          {locationDisplay && (
            <span className="flex items-center gap-1 text-white/60 text-xs md:text-sm">
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              {locationDisplay}
            </span>
          )}

          {/* Social Icons - Only if social_control is true */}
          {showSocialIcons && (
            <div className="flex items-center gap-1 md:gap-2">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="Instagram"
                >
                  <Instagram className="w-3 h-3 md:w-4 md:h-4 text-white/60 group-hover:text-pink-500 transition-colors" />
                </a>
              )}
              
              {profile.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="TikTok"
                >
                  <Music className="w-3 h-3 md:w-4 md:h-4 text-white/60 group-hover:text-black transition-colors" />
                </a>
              )}
              
              {profile.facebook && (
                <a
                  href={`https://facebook.com/${profile.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="Facebook"
                >
                  <Facebook className="w-3 h-3 md:w-4 md:h-4 text-white/60 group-hover:text-blue-600 transition-colors" />
                </a>
              )}
              
              {profile.youtube && (
                <a
                  href={`https://youtube.com/@${profile.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="YouTube"
                >
                  <Youtube className="w-3 h-3 md:w-4 md:h-4 text-white/60 group-hover:text-red-600 transition-colors" />
                </a>
              )}
              
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 md:p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="Twitter/X"
                >
                  <Twitter className="w-3 h-3 md:w-4 md:h-4 text-white/60 group-hover:text-blue-400 transition-colors" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Website Link - Centered */}
      {profile.website && (
        <div className="flex justify-center mb-4">
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] md:text-xs text-[#D4AF37] hover:text-yellow-400 transition-colors"
          >
            <LinkIcon className="w-3 h-3 md:w-4 md:h-4" />
            {profile.website.replace(/^https?:\/\//, '').substring(0, 30)}
          </a>
        </div>
      )}

      {/* Admin Panel Button - Only visible to page owner if profile.role is admin */}
      {isAdminAndOwner && (
        <div className="flex justify-center py-4 border-t border-white/10">
          <button
            onClick={handleAdminPanelClick}
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg md:rounded-xl px-6 py-3 text-center transition-all group border border-purple-500/30 flex items-center gap-3"
          >
            <Shield className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                Admin Panel
              </div>
              <div className="text-[10px] text-white/40">Manage the platform</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}