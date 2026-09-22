// components/Home/TopCandidates.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Info, ChevronRight, Heart, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import VoteModal from '../profile/VoteModal';
import GiftModal from '../profile/GiftModal';

const TopCandidates = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [voteModalProfile, setVoteModalProfile] = useState(null);
  const [giftModalProfile, setGiftModalProfile] = useState(null);

  useEffect(() => {
    fetchTopCandidates();
  }, []);

  const fetchTopCandidates = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, country, verification_level, account_status, vote_control, vote_visibility, role')
        .eq('account_status', 'active')
        .eq('verification_level', 'fully_verified')
        .not('username', 'is', null)
        .not('role', 'eq', 'admin')
        .not('role', 'eq', 'fan')
        .not('role', 'eq', 'fans');

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const { data: voteStats, error: statsError } = await supabase
        .from('vote_statistics')
        .select('candidate_id, total_votes')
        .in('candidate_id', profiles.map(p => p.id));

      if (statsError) throw statsError;

      const candidatesWithVotes = profiles.map(profile => {
        const stats = voteStats?.find(vs => vs.candidate_id === profile.id);
        return {
          ...profile,
          total_votes: stats?.total_votes || 0
        };
      });

      const sortedCandidates = candidatesWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .map((candidate, index) => ({
          ...candidate,
          rank: (index + 1).toString().padStart(3, '0')
        }))
        .slice(0, 4);

      setCandidates(sortedCandidates);
    } catch (error) {
      console.error('Error fetching top candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (username) => {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const formatVotes = (votes) => {
    if (votes >= 1000000) return (votes / 1000000).toFixed(1) + 'M';
    if (votes >= 1000) return (votes / 1000).toFixed(1) + 'K';
    return votes.toString();
  };

  const handleCardClick = (username) => {
    router.push(`/${username}/voteprofile`);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="w-20"></div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">Housemates</h2>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gray-800/50 animate-pulse">
              <div className="h-48 md:h-64 bg-gray-700"></div>
              <div className="p-3 md:p-4 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (candidates.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="w-20"></div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">Top 4 Candidates</h2>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="text-center py-12 md:py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center border border-orange-500/30">
            <Info className="w-8 h-8 text-orange-400 flex-shrink-0" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Candidates Yet</h3>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Check back soon for our featured candidates!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="w-20"></div>

        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white">Top Candidates</h2>
        </div>

        <button
          onClick={() => router.push('/candidates')}
          className="flex items-center gap-2 text-white/80 hover:text-white group w-20 justify-end"
        >
          <span className="text-xs font-medium">VIEW ALL</span>
          <div className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </div>
        </button>
      </div>

      {/* Candidates Grid — same card design as /candidates page */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            onClick={() => handleCardClick(candidate.username)}
            className="group cursor-pointer"
          >
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-white/10 hover:border-[#C58B2A]/50 transition-all duration-300">
              {/* Candidate Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-800">
                {candidate.avatar_url ? (
                  <Image
                    src={candidate.avatar_url}
                    alt={formatUsername(candidate.username)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center metallic-gold">
                    <span className="text-4xl font-bold text-white/50">
                      {formatUsername(candidate.username)?.charAt(0) || '?'}
                    </span>
                  </div>
                )}

                {/* Rank Badge */}
                {candidate.verification_level === 'fully_verified' && candidate.rank && (
                  <div className="absolute top-2 left-2">
                    <div className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-orange-400/30">
                      <span className="text-[10px] font-bold text-[#F6D77A]">#{candidate.rank}</span>
                    </div>
                  </div>
                )}

                {/* Country Badge */}
                {candidate.country && (
                  <div className="absolute top-2 right-2">
                    <div className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
                      <span className="text-[8px] font-medium text-white/80">{candidate.country}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Candidate Info */}
              <div className="p-2.5">
                <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-[#C58B2A] transition-colors">
                  {formatUsername(candidate.username)}
                </h3>

                {/* Vote count — only when visibility is on */}
                {candidate.vote_visibility === 'on' && (
                  <div className="mb-2">
                    <div className="text-[8px] text-white/40">VOTES</div>
                    <div className="text-xs font-bold text-[#C58B2A]">
                      {formatVotes(candidate.total_votes || 0)}
                    </div>
                  </div>
                )}

                {/* Vote + Gift buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoteModalProfile(candidate);
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black text-[10px] font-bold hover:opacity-90 transition-opacity"
                  >
                    <Heart className="w-3 h-3 fill-current" />
                    <span>Vote</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGiftModalProfile(candidate);
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/15 text-white text-[10px] font-bold transition-colors"
                  >
                    <Gift className="w-3 h-3" />
                    <span>Gift Me</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vote Modal */}
      {voteModalProfile && (
        <VoteModal
          isOpen={!!voteModalProfile}
          onClose={() => setVoteModalProfile(null)}
          profile={voteModalProfile}
          onVoteSuccess={() => console.log('Vote cast successfully')}
          onVoteError={(err) => console.error('Vote error:', err)}
        />
      )}

      {/* Gift Modal */}
      {giftModalProfile && (
        <GiftModal
          isOpen={!!giftModalProfile}
          onClose={() => setGiftModalProfile(null)}
          profile={giftModalProfile}
          onGiftSuccess={() => console.log('Gift sent successfully')}
          onGiftError={(err) => console.error('Gift error:', err)}
        />
      )}
    </section>
  );
};

export default TopCandidates;