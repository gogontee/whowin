// app/challenge/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Loader
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function ChallengePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push('/auth/login?redirect=/challenge');
          return;
        }

        setUser(currentUser);

        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (!error && profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const getChallengeMessage = () => {
    const name = profile?.full_name || profile?.username || 'I';
    return `I accepted the challenge to contest but i also want to challenge you into the contest if you have what it takes to win, then lets go dig on Who Wins Reality Show.`;
  };

  const getShareText = () => {
    const baseMessage = getChallengeMessage();
    return `${baseMessage} https://whowinshow.com`;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Who Wins Challenge',
      text: getShareText(),
      url: 'https://whowinshow.com',
    };

    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(getShareText());
        setCopied(true);
        setShowCopiedFeedback(true);
        setTimeout(() => {
          setShowCopiedFeedback(false);
          setCopied(false);
        }, 3000);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        // Fallback to clipboard if share fails
        try {
          await navigator.clipboard.writeText(getShareText());
          setCopied(true);
          setShowCopiedFeedback(true);
          setTimeout(() => {
            setShowCopiedFeedback(false);
            setCopied(false);
          }, 3000);
        } catch (clipError) {
          console.error('Clipboard error:', clipError);
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://whowinshow.com');
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
          <p className="text-white/60 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-0 w-[200px] h-[200px] bg-green-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 mb-4">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-xs font-medium tracking-wider">CHALLENGE MODE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Accept the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Challenge</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            Challenge someone to join the contest. Show them you have what it takes!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Challenge Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-2xl border border-white/10 p-6 md:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {profile?.full_name || profile?.username || 'Challenger'}
                </p>
                <p className="text-white/40 text-xs">Challenger</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/5 mb-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {getChallengeMessage()}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
                    <Trophy className="w-3 h-3" />
                    <span>Who Wins Reality Show</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Preview */}
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <div className="relative aspect-video">
                <Image
                  src="/poster1.png"
                  alt="Challenge Poster"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Overlay Text */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-sm uppercase tracking-wider">
                    Who Wins Reality Show
                  </p>
                  <p className="text-white/60 text-xs">
                    Accept the challenge
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            {/* Stats / Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 border border-white/10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-white font-bold text-lg">1</p>
                <p className="text-white/40 text-xs">You</p>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 border border-white/10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-white font-bold text-lg">∞</p>
                <p className="text-white/40 text-xs">To Challenge</p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 md:p-6 border border-white/10">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-orange-400" />
                Share the Challenge
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Share on WhatsApp
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Challenge Options */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 md:p-6 border border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Quick Challenge</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Friend
                </button>
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Group
                </button>
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/80 transition-colors flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Social
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-white/30 text-xs">
            By sharing, you agree to our terms and conditions. 
            Challenge someone today and show them the Who Win spirit!
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
            <p className="text-white text-sm font-medium">Copied!</p>
            <p className="text-white/40 text-xs">Link copied to clipboard</p>
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