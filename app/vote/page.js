// app/vote/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, ChevronRight, Eye } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function VotePage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [countries, setCountries] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    // Handle search and filtering
    const query = searchQuery.toLowerCase().trim();
    
    if (query === '') {
      setIsSearching(false);
      setSearchResults([]);
      // Show only verified candidates when not searching
      const verified = candidates.filter(c => c.verification_level === 'fully_verified');
      applyFilters(verified);
      return;
    }

    setIsSearching(true);
    
    // Search across all profiles (including unverified) - exclude admin and fan roles
    const searchResults = allProfiles.filter(profile => {
      // Skip suspended accounts
      if (profile.account_status === 'suspended') return false;
      
      // Exclude admin and fan roles
      if (profile.role === 'admin' || profile.role === 'fan' || profile.role === 'fans') return false;
      
      const username = profile.username?.toLowerCase() || '';
            const fullName = profile.full_name?.toLowerCase() || '';
      const country = profile.country?.toLowerCase() || '';
      
            return username.includes(query) ||
              fullName.includes(query) ||
             country.includes(query);
    });

    setSearchResults(searchResults);
    
    // Apply country filter to search results
    let filtered = searchResults;
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(item => item.country === selectedCountry);
    }
    setFilteredCandidates(filtered);
    
  }, [searchQuery, selectedCountry, candidates, allProfiles]);

  const applyFilters = (data) => {
    let filtered = data;
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(item => item.country === selectedCountry);
    }
    setFilteredCandidates(filtered);
  };

  const fetchCandidates = async () => {
    try {
      // Get ALL profiles (including unverified) for search - exclude admin and fan roles
      const { data: allProfilesData, error: allError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, country, verification_level, account_status, vote_control, vote_visibility, role')
        .not('username', 'is', null)
        .not('role', 'eq', 'admin')
        .not('role', 'eq', 'fan')
        .not('role', 'eq', 'fans');

      if (allError) throw allError;
      setAllProfiles(allProfilesData || []);

      // Get only eligible candidates for display (active and fully verified) - exclude admin and fan roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, country, verification_level, account_status, vote_control, vote_visibility, role')
        .eq('account_status', 'active')
        .eq('verification_level', 'fully_verified')
        .not('username', 'is', null)
        .not('role', 'eq', 'admin')
        .not('role', 'eq', 'fan')
        .not('role', 'eq', 'fans');

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setCandidates([]);
        setFilteredCandidates([]);
        setLoading(false);
        return;
      }

      // Get vote statistics for all candidates
      const profileIds = profiles.map(p => p.id);
      const { data: voteStats, error: statsError } = await supabase
        .from('vote_statistics')
        .select('candidate_id, total_votes')
        .in('candidate_id', profileIds);

      if (statsError) throw statsError;

      // Combine profiles with their vote counts
      const candidatesWithVotes = profiles.map(profile => {
        const stats = voteStats?.find(vs => vs.candidate_id === profile.id);
        return {
          ...profile,
          total_votes: stats?.total_votes || 0
        };
      });

      // Sort by total_votes in descending order
      const sortedCandidates = candidatesWithVotes
        .sort((a, b) => b.total_votes - a.total_votes)
        .map((candidate, index) => ({
          ...candidate,
          rank: (index + 1).toString().padStart(3, '0')
        }));

      setCandidates(sortedCandidates);
      
      // Apply initial filters (show only verified)
      const verified = sortedCandidates.filter(c => c.verification_level === 'fully_verified');
      applyFilters(verified);
      
      // Extract unique countries from verified candidates
      const uniqueCountries = [...new Set(verified.map(c => c.country).filter(Boolean))];
      setCountries(uniqueCountries);
      
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
      setFilteredCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (username) => {
    if (!username) return '';
    // Capitalize first letter, keep rest as is
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

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    const verified = candidates.filter(c => c.verification_level === 'fully_verified');
    applyFilters(verified);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8">
            <div className="h-8 w-64 bg-gray-800/50 rounded-lg animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-96 bg-gray-800/50 rounded-lg animate-pulse mx-auto"></div>
          </div>
          <div className="max-w-xl mx-auto mb-8">
            <div className="h-12 bg-gray-800/50 rounded-xl animate-pulse"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-800/50 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-700/50"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-700/50 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayCandidates = isSearching ? filteredCandidates : filteredCandidates;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {isSearching ? 'Candidate Search Results' : 'Find Your Candidate'}
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            {isSearching 
              ? `Found ${filteredCandidates.length} candidates matching "${searchQuery}"`
              : 'Search for a housemate by name or Nickname.'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative flex items-center bg-black/50 rounded-lg border border-white/10">
            <Search className="w-4 h-4 text-[#C58B2A] ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by candidate name or Nickname..."
              className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-sm text-white placeholder-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3 text-gray-500 flex-shrink-0" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="text-xs text-white/50 mt-1.5 px-1">
              Search results include candidates who are still completing verification.
            </p>
          )}
        </div>

        {/* Country Filters */}
        {countries.length > 0 && !isSearching && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            <button
              onClick={() => setSelectedCountry('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCountry === 'all'
                  ? 'metallic-gold text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All ({candidates.filter(c => c.verification_level === 'fully_verified').length})
            </button>
            {countries.map(country => {
              const count = candidates.filter(c => c.country === country && c.verification_level === 'fully_verified').length;
              return (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCountry === country
                      ? 'metallic-gold text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {country} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Results Info */}
        {isSearching && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-white/60 text-sm">
              {filteredCandidates.length} results found
            </span>
            <div className="text-white/60 text-sm flex items-center gap-2">
              <span>Searching for "{searchQuery}"</span>
              <button
                onClick={clearSearch}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="w-3 h-3 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Candidates Grid */}
        {displayCandidates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {displayCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => handleViewProfile(candidate.username)}
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
                    
                    {/* Rank Badge - Only for verified candidates */}
                    {candidate.verification_level === 'fully_verified' && candidate.rank && (
                      <div className="absolute top-2 left-2">
                          <div className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-[#C58B2A]/30">
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
                    {/* Name - Using username with first letter capitalized, no @ */}
                    <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-[#C58B2A] transition-colors">
                      {formatUsername(candidate.username)}
                    </h3>
                    
                    {/* Only show vote count when global visibility is on */}
                    {candidate.vote_visibility === 'on' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[8px] text-white/40">VOTES</div>
                          <div className="text-xs font-bold text-[#C58B2A]">
                            {formatVotes(candidate.total_votes || 0)}
                          </div>
                        </div>
                        
                        {/* View Candidate Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(candidate.username);
                          }}
                          className="px-2 py-1 rounded-md metallic-green transition-colors text-[10px] font-medium flex items-center gap-0.5"
                        >
                          <Eye className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>VIEW</span>
                          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
                        </button>
                      </div>
                    )}

                    {/* If global vote visibility is off, show a neutral profile state */}
                    {candidate.vote_visibility !== 'on' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[8px] text-white/40">STATUS</div>
                          <div className="text-[10px] font-medium text-[#8FDAA9]">Profile available</div>
                        </div>
                        
                        {/* View Candidate Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(candidate.username);
                          }}
                          className="px-2 py-1 rounded-md metallic-green transition-colors text-[10px] font-medium flex items-center gap-0.5"
                        >
                          <Eye className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>VIEW</span>
                          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-white/20 mb-4 flex-shrink-0" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No candidate found' : 'Search for your candidate'}
            </h3>
            <p className="text-white/60 text-sm">
              {searchQuery 
                ? `No results found for "${searchQuery}". Try a different search term.`
                : 'No candidates are currently displayed. Search by name or Nickname to find your candidate.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}