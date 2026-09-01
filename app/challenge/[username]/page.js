// app/challenge/[username]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Share2, 
  Users, 
  Trophy, 
  Flame, 
  Zap, 
  Send, 
  Copy, 
  Check, 
  ChevronRight,
  Crown,
  Sparkles,
  Target,
  MoveRight,
  Loader,
  ArrowLeft,
  Calendar,
  Star
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  
  const [candidate, setCandidate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidate profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          router.push('/404');
          return;
        }

        setCandidate(profileData);

        // Check if current user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user || null);

        if (user) {
          // Check if user is registered (has profile)
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, account_status')
            .eq('id', user.id)
            .single();

          setIsRegistered(!!userProfile);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, router, supabase]);

  const getChallengeMessage = () => {
    const name = candidate?.full_name || candidate?.username || 'I';
    return `🔥 ${name} is challenging YOU!

I accepted the challenge to contest but i also want to challenge you into the contest if you have what it takes to win, then lets go dig on Who Wins Reality Show.

Are you ready?`;
  };

  // SINGLE LINK ONLY - The challenge URL
  const getChallengeUrl = () => {
    return `https://whowinshow.com/challenge/${username}`;
  };

  // WhatsApp share text with ONLY the challenge URL
  const getWhatsAppText = () => {
    return `${getChallengeMessage()}

${getChallengeUrl()}`;
  };

  // Twitter share text
  const getTwitterText = () => {
    const name = candidate?.full_name || candidate?.username;
    return `🔥 ${name} challenged me to join Who Wins Reality Show! Think you have what it takes? ${getChallengeUrl()}`;
  };

  const getWhatsAppLink = () => {
    const text = encodeURIComponent(getWhatsAppText());
    return `https://wa.me/?text=${text}`;
  };

  const getTwitterLink = () => {
    const text = encodeURIComponent(getTwitterText());
    return `https://twitter.com/intent/tweet?text=${text}`;
  };

  const getFacebookLink = () => {
    const text = encodeURIComponent(getChallengeMessage());
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getChallengeUrl())}&quote=${text}`;
  };

  const handleShare = async (platform) => {
    if (platform === 'whatsapp') {
      window.open(getWhatsAppLink(), '_blank');
      return;
    }

    if (platform === 'twitter') {
      window.open(getTwitterLink(), '_blank');
      return;
    }

    if (platform === 'facebook') {
      window.open(getFacebookLink(), '_blank');
      return;
    }

    // Copy link (default)
    try {
      await navigator.clipboard.writeText(getChallengeUrl());
      setCopied(true);
      setShowCopiedFeedback(true);
      setTimeout(() => {
        setShowCopiedFeedback(false);
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 mt-4 text-sm">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-0 w-[200px] h-[200px] bg-green-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Challenge Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 mb-4">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-xs font-medium tracking-wider">CHALLENGE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
              {candidate?.full_name || candidate?.username || 'Someone'}
            </span>
            <span className="text-white"> Challenges You!</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            45 Housemates. 28 Days. ₦19M Worth of prizes.
            Think you have what it takes?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Challenge Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-2xl border border-white/10 p-6 md:p-8 backdrop-blur-sm">
            {/* Challenger Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-black">
                {candidate?.full_name?.charAt(0) || candidate?.username?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-white font-semibold text-base">
                  {candidate?.full_name || candidate?.username}
                </p>
                <p className="text-white/40 text-xs">@{candidate?.username}</p>
                {candidate?.country && (
                  <p className="text-white/30 text-xs">{candidate.country}</p>
                )}
              </div>
            </div>

            {/* Challenge Message */}
            <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/5 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                    {getChallengeMessage()}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                    <Trophy className="w-3 h-3" />
                    <span>Who Wins Reality Show</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Stats */}
<div className="grid grid-cols-3 gap-2">
  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-2xl font-bold text-orange-400">45</div>
    <div className="text-[10px] text-white/40">Housemates</div>
  </div>

  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-2xl font-bold text-yellow-400">28</div>
    <div className="text-[10px] text-white/40">Days</div>
  </div>

  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-2xl font-bold text-green-400">₦19M</div>
    <div className="text-[10px] text-white/40">Worth of Prizes</div>
  </div>
</div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            {/* Call to Action */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-2">
                {isRegistered ? '🔥 You\'re Already Registered!' : '🔥 Ready to Take the Challenge?'}
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {isRegistered 
                  ? 'Why not take the challenge and complete your application?'
                  : 'Join the Who Wins Reality Show and compete for the crown!'}
              </p>
              {isRegistered ? (
                <Link
                  href={`/${candidate.username}`}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Go To Your Page
                </Link>
              ) : (
                <Link
                  href="/auth/signup?redirect=/challenge"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Register to Contest
                </Link>
              )}
            </div>

            {/* Share Buttons */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 md:p-6 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-orange-400" />
                Share the Challenge
              </h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-green-500/30"
                >
                  <Send className="w-4 h-4" />
                  Share on WhatsApp
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleShare('twitter')}
                    className="py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter/X
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 md:mt-10 text-center">
          <p className="text-white/30 text-xs">
            By accepting this challenge, you agree to the Who Wins terms and conditions.
            The journey to becoming a winner starts here!
          </p>
          <div className="flex justify-center items-center gap-2 mt-3 text-white/20 text-xs">
            <Crown className="w-3 h-3" />
            <span>Who Wins Reality Show</span>
          </div>
        </div>
      </div>

      {/* Copied Feedback Toast */}
      {showCopiedFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-up">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Link Copied!</p>
            <p className="text-white/40 text-xs">Share it with your friends</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px) translateX(-50%);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}