// components/profile/ProfileHeader.jsx
import { Settings, Users, Gift, Eye, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

export default function ProfileHeader({ 
  stats, 
  isOwner, 
  onSettingsClick, 
  profile,
  onGiftClick,
  onVoteClick,
  onShareClick
}) {
  const params = useParams();
  const username = params.username;
  const [supportersCount, setSupportersCount] = useState(0);
  const [loadingSupporters, setLoadingSupporters] = useState(false);
  const [liveVotes, setLiveVotes] = useState(0);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [showVoteCount, setShowVoteCount] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Gold color: #D4AF37
  const goldColor = '#D4AF37';

  // Check if vote count should be visible
  useEffect(() => {
    if (profile?.vote_control === true) {
      setShowVoteCount(true);
      return;
    }
    if (isOwner) {
      setShowVoteCount(true);
    } else {
      setShowVoteCount(false);
    }
  }, [isOwner, profile?.vote_control]);

  // Fetch live vote count directly from database
  useEffect(() => {
    if (!profile?.id || !showVoteCount) return;

    const fetchVotes = async () => {
      setLoadingVotes(true);
      try {
        const { data, error } = await supabase
          .from('vote_transactions')
          .select('votes')
          .eq('candidate_id', profile.id)
          .eq('status', 'completed');

        if (error) {
          console.error('Error fetching votes:', error);
          setLiveVotes(0);
          return;
        }

        const totalVotes = data?.reduce((sum, tx) => sum + (tx.votes || 0), 0) || 0;
        setLiveVotes(totalVotes);
      } catch (error) {
        console.error('Error fetching votes:', error);
        setLiveVotes(0);
      } finally {
        setLoadingVotes(false);
      }
    };

    fetchVotes();

    const subscription = supabase
      .channel(`votes-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vote_transactions',
          filter: `candidate_id=eq.${profile.id}`
        },
        (payload) => {
          setLiveVotes(prev => prev + (payload.new?.votes || 0));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vote_transactions',
          filter: `candidate_id=eq.${profile.id}`
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id, supabase, showVoteCount]);

  // Fetch unique supporters count (only for owner)
  useEffect(() => {
    if (profile?.id && isOwner) {
      fetchSupportersCount();
    }
  }, [profile?.id, isOwner]);

  const fetchSupportersCount = async () => {
    if (!profile?.id) return;
    
    setLoadingSupporters(true);
    try {
      const { data, error } = await supabase
        .from('vote_transactions')
        .select('user_id, guest_email')
        .eq('candidate_id', profile.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching supporters:', error);
        setSupportersCount(0);
        return;
      }

      if (!data || data.length === 0) {
        setSupportersCount(0);
        return;
      }

      const uniqueSupporters = new Set();
      data.forEach(transaction => {
        if (transaction.user_id) {
          uniqueSupporters.add(`user_${transaction.user_id}`);
        } else if (transaction.guest_email) {
          uniqueSupporters.add(`guest_${transaction.guest_email}`);
        }
      });

      setSupportersCount(uniqueSupporters.size);
    } catch (error) {
      console.error('Error fetching supporters:', error);
      setSupportersCount(0);
    } finally {
      setLoadingSupporters(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 mb-6">
      {/* Vote Now Button - With Shockwave Effect */}
      <div className="relative flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px]">
        {/* Shockwave Rings - Behind the button with reduced wave length */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${goldColor}, #f59e0b)`,
            boxShadow: `0 0 15px ${goldColor}40`,
          }}
          animate={!isHovered ? {
            scale: [1, 1.15, 1.3, 1.15, 1],
            opacity: [0.5, 0.3, 0.1, 0.3, 0.5],
          } : {
            scale: 1,
            opacity: 0
          }}
          transition={!isHovered ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {
            duration: 0.3
          }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, #fbbf24, ${goldColor})`,
            boxShadow: `0 0 20px ${goldColor}30`,
          }}
          animate={!isHovered ? {
            scale: [1, 1.2, 1.4, 1.2, 1],
            opacity: [0.35, 0.2, 0.05, 0.2, 0.35],
          } : {
            scale: 1,
            opacity: 0
          }}
          transition={!isHovered ? {
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          } : {
            duration: 0.3
          }}
        />

        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, #f59e0b, #fbbf24)`,
            boxShadow: `0 0 25px ${goldColor}20`,
          }}
          animate={!isHovered ? {
            scale: [1, 1.25, 1.5, 1.25, 1],
            opacity: [0.25, 0.15, 0.03, 0.15, 0.25],
          } : {
            scale: 1,
            opacity: 0
          }}
          transition={!isHovered ? {
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6
          } : {
            duration: 0.3
          }}
        />

        {/* Main Button */}
        <motion.button
          onClick={onVoteClick}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg overflow-hidden z-10"
          style={{
            background: `linear-gradient(135deg, ${goldColor}, #f59e0b)`,
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Shine animation on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          
          {/* Button Content */}
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-current drop-shadow relative z-10" />
          <span className="text-[10px] sm:text-sm font-bold text-black whitespace-nowrap relative z-10">
            Vote Now
          </span>
        </motion.button>
      </div>

      {/* Send Gift Button */}
      <button
        onClick={onGiftClick}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all hover:scale-105 flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] justify-center"
        style={{
          background: `linear-gradient(135deg, ${goldColor}20, ${goldColor}10)`,
          border: `1px solid ${goldColor}40`,
        }}
      >
        <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: goldColor }} />
        <span className="text-[10px] sm:text-sm font-semibold text-[#D4AF37] whitespace-nowrap">
          Send Gift
        </span>
      </button>

      {/* My Supporters Button - Only visible to page owner */}
      {isOwner && (
        <Link
          href={`/${username}/myvoters`}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all group flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] justify-center"
          style={{
            background: `linear-gradient(135deg, ${goldColor}12, ${goldColor}06)`,
            borderColor: `${goldColor}30`,
          }}
        >
          <Users 
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" 
            style={{ color: goldColor }}
          />
          <span className="text-[10px] sm:text-sm font-medium text-white whitespace-nowrap">
            My Supporters
          </span>
          <span className="text-[10px] sm:text-sm font-bold text-[#D4AF37]">
            {loadingSupporters ? '...' : supportersCount}
          </span>
        </Link>
      )}

      {/* Vote Count Button - Show based on vote_control */}
      {showVoteCount && (
        <div
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] justify-center"
          style={{
            background: `linear-gradient(135deg, ${goldColor}10, ${goldColor}05)`,
            border: `1px solid ${goldColor}30`,
          }}
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: goldColor }} />
          <span className="text-[10px] sm:text-sm font-medium text-white whitespace-nowrap">
            Votes
          </span>
          <span className="text-[10px] sm:text-sm font-bold text-[#D4AF37] transition-all duration-300">
            {loadingVotes ? '...' : liveVotes?.toLocaleString() || 0}
          </span>
        </div>
      )}

      {/* Share Button - Before Settings */}
      <button
        onClick={onShareClick}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all hover:scale-105 flex-1 sm:flex-none min-w-[100px] sm:min-w-[120px] justify-center"
        style={{
          background: `linear-gradient(135deg, ${goldColor}20, ${goldColor}10)`,
          border: `1px solid ${goldColor}40`,
        }}
      >
        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: goldColor }} />
        <span className="text-[10px] sm:text-sm font-semibold text-[#D4AF37] whitespace-nowrap">
          Share
        </span>
      </button>

      {/* Settings (only for owner) */}
      {isOwner && (
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-white hover:text-[#D4AF37] transition-colors" />
        </button>
      )}
    </div>
  );
}