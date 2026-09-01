// components/Home/TopCandidates.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Info, ChevronRight, Eye } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const TopCandidates = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchTopCandidates();
  }, []);

  const fetchTopCandidates = async () => {
    try {
      // Get all eligible candidates (active and fully verified)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, country, verification_level, account_status')
        .eq('account_status', 'active')
        .eq('verification_level', 'fully_verified')
        .not('username', 'is', null);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      // Get vote statistics for all candidates
      const { data: voteStats, error: statsError } = await supabase
        .from('vote_statistics')
        .select('candidate_id, total_votes')
        .in('candidate_id', profiles.map(p => p.id));

      if (statsError) throw statsError;

      // Combine profiles with their vote counts
      const candidatesWithVotes = profiles.map(profile => {
        const stats = voteStats?.find(vs => vs.candidate_id === profile.id);
        return {
          ...profile,
          total_votes: stats?.total_votes || 0
        };
      });

      // Sort by total_votes in descending order and assign ranks
      const sortedCandidates = candidatesWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .map((candidate, index) => ({
          ...candidate,
          rank: (index + 1).toString().padStart(3, '0')
        }))
        .slice(0, 4); // Get top 4 candidates

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
    // Capitalize first letter
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const formatVotes = (votes) => {
    if (votes >= 1000000) {
      return (votes / 1000000).toFixed(1) + 'M';
    }
    if (votes >= 1000) {
      return (votes / 1000).toFixed(1) + 'K';
    }
    return votes.toString();
  };

  const handleViewProfile = (username) => {
    router.push(`/${username}`);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="w-20"></div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">Top 4 Candidates</h2>
          </div>
          <div className="w-20"></div>
        </div>
        
        {/* Loading Skeleton */}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="w-20"></div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">Top 4 Candidates</h2>
            
          </div>
          <div className="w-20"></div>
        </div>
        
        {/* Empty State */}
        <div className="text-center py-12 md:py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center border border-orange-500/30">
            <Info className="w-8 h-8 text-orange-400" />
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
        
        {/* View All Button */}
        <button 
          onClick={() => router.push('/candidates')}
          className="flex items-center gap-2 text-white/80 hover:text-white group w-20 justify-end"
        >
          <span className="text-xs font-medium">VIEW ALL</span>
          <div className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
      
      {/* Candidates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="group cursor-pointer" onClick={() => handleViewProfile(candidate.username)}>
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-300 hover:border-gray-200 transition-colors duration-300">
              {/* Candidate image */}
              <div className="relative h-48 md:h-64 overflow-hidden">
                {candidate.avatar_url ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url(${candidate.avatar_url})` }}
                  ></div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/50">
                      {candidate.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Rank badge */}
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-orange-400/30">
                    <span className="text-xs font-bold text-orange-400">#{candidate.rank}</span>
                  </div>
                </div>
              </div>
              
              {/* Candidate info */}
              <div className="p-3 md:p-4">
                {/* Name and Country - Side by side */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-bold text-white truncate max-w-[60%]">
                    {formatUsername(candidate.username)}
                  </h3>
                  <p className="text-white/70 text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {candidate.country || 'INTL'}
                  </p>
                </div>
                
                {/* Votes and View - Side by side */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/50 text-[8px] md:text-[10px]">VOTES</div>
                    <div className="text-orange-400 text-sm md:text-base font-bold">
                      {formatVotes(candidate.total_votes)}
                    </div>
                  </div>
                  
                  {/* Small View Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(candidate.username);
                    }}
                    className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors border border-gray-400/30 text-[10px] md:text-xs font-medium text-white flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>VIEW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopCandidates;