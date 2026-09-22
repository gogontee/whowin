// app/[username]/VoteProfileClient.js
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Gift,
  Copy,
  Check,
  MessageCircle,
  Facebook,
  Instagram,
  HelpCircle,
  ArrowRight,
  Loader,
  User as UserIcon,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import VoteModal from '../../../components/profile/VoteModal';
import GiftModal from '../../../components/profile/GiftModal';
import HowToVote from '../../../components/HowToVote';

export default function VoteProfileClient() {
  const params = useParams();
  const username = params.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showHowToVote, setShowHowToVote] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, country, bio, account_status, verification_level, vote_visibility')
          .eq('username', username)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
          setProfile(null);
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  // ============================================================
  // Share helpers
  // ============================================================
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${username}/voteprofile`;
  };

  const getShareMessage = () => {
    const name = (profile?.username || '').toUpperCase() || 'ME';
    return `Hello, I am participating in the Who Wins Reality Show Season 2.
Please help vote for me — I need votes to qualify.

HOW TO VOTE:
1. Click this link to vote or visit whowinshow.com
2. CLICK ON THE VOTE BUTTON
3. TYPE MY NAME: ${name}
4. MY PHOTO WILL SHOW UP — then you can vote or send a gift by clicking the Vote or Gift button.

I so much appreciate your support and I hope it will help me emerge as one of the housemates on Who Wins 2026 Edition.`;
  };

  const handleCopyLink = async () => {
    try {
      const fullText = `${getShareMessage()}\n\n${getShareUrl()}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const fullText = `${getShareMessage()}\n\n${getShareUrl()}`;
    const text = encodeURIComponent(fullText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    // Facebook's sharer only accepts the URL — the preview comes from OG tags
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleShareInstagram = async () => {
    try {
      const fullText = `${getShareMessage()}\n\n${getShareUrl()}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Instagram share (copy) failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-[#C58B2A] animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm">Loading candidate...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#C58B2A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-10 h-10 text-[#C58B2A]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Candidate Not Found</h1>
          <p className="text-white/60 text-sm mb-6">
            We couldn't find the candidate you're trying to vote for.
          </p>
          <Link
            href="/candidates"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
            Browse Candidates
          </Link>
        </div>
      </div>
    );
  }

  const displayName = (profile.username || '').toUpperCase();

  // ---- Shared pieces used in both layouts ----

  // Compact profile card
  const ProfileCard = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-b from-white/5 to-black/40 rounded-2xl border border-white/10 overflow-hidden w-full max-w-sm mx-auto"
    >
      {/* Title */}
      <div className="px-4 pt-4 pb-2 text-center">
        <h1 className="text-lg md:text-xl font-extrabold text-white tracking-wide">
          VOTE <span className="text-[#C58B2A]">{displayName}</span>
        </h1>
      </div>

      {/* Profile photo (smaller aspect-square) */}
      <div className="px-4">
        <div className="relative w-full aspect-square max-h-[280px] md:max-h-[320px] rounded-2xl overflow-hidden bg-gray-800 border border-white/10">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username || 'Candidate'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 380px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#C58B2A]/20 to-yellow-500/10">
              <UserIcon className="w-16 h-16 text-white/30" />
            </div>
          )}

          {profile.country && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
              <span className="text-[10px] font-medium text-white/90">
                {profile.country}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5 p-4">
        <button
          onClick={() => setShowVoteModal(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          Vote Now
        </button>

        <button
          onClick={() => setShowGiftModal(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all duration-300 hover:-translate-y-0.5"
        >
          <Gift className="w-3.5 h-3.5" />
          Send Gift
        </button>
      </div>
    </motion.div>
  );

  // Share bar — horizontal on mobile, stacked vertical on desktop right column
  const ShareBarDesktop = (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1">
        Share
      </p>
      <div className="space-y-2">
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-xs font-medium transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleShareFacebook}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-medium transition-colors"
        >
          <Facebook className="w-4 h-4" />
          <span>Facebook</span>
        </button>

        <button
          onClick={handleShareInstagram}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 text-xs font-medium transition-colors"
        >
          <Instagram className="w-4 h-4" />
          <span>Instagram</span>
        </button>
      </div>
    </div>
  );

  const ShareBarMobile = (
    <div className="w-full border-y border-white/10 bg-black/60 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-3 py-2.5">
        <div className="flex items-center justify-between gap-1.5">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-medium transition-colors min-w-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span className="truncate text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-[10px] font-medium transition-colors min-w-0"
          >
            <MessageCircle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>

          <button
            onClick={handleShareFacebook}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-[10px] font-medium transition-colors min-w-0"
          >
            <Facebook className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Facebook</span>
          </button>

          <button
            onClick={handleShareInstagram}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 text-[10px] font-medium transition-colors min-w-0"
          >
            <Instagram className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Instagram</span>
          </button>
        </div>
      </div>
    </div>
  );

  // How-to-vote CTA card
  const HowToVoteCard = (
    <div className="bg-gradient-to-br from-[#C58B2A]/10 to-yellow-500/5 rounded-2xl border border-[#C58B2A]/20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#C58B2A]/20 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5 text-[#C58B2A]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-bold text-white mb-1 leading-snug">
            Do you want to see how to vote or send Gift to your favorite?
          </h3>
          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            See a quick guide on how to cast your vote for {displayName}.
          </p>
          <button
            onClick={() => setShowHowToVote(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Click Here
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block">
        <div className="container mx-auto px-6 pt-8 pb-10 max-w-5xl">
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Left column — profile card */}
            <div>
              {ProfileCard}
            </div>

            {/* Right column — share + how-to-vote */}
            <div className="space-y-4">
              {ShareBarDesktop}
              {HowToVoteCard}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden pb-12">
        <div className="container mx-auto px-4 pt-4 pb-2">
          {ProfileCard}
        </div>

        <div className="mt-3">
          {ShareBarMobile}
        </div>

        <div className="container mx-auto px-4 py-4">
          {HowToVoteCard}
        </div>
      </div>

      {/* ===== Modals ===== */}
      <AnimatePresence>
        {showVoteModal && (
          <VoteModal
            isOpen={showVoteModal}
            onClose={() => setShowVoteModal(false)}
            profile={profile}
            onVoteSuccess={() => console.log('Vote cast successfully')}
            onVoteError={(err) => console.error('Vote error:', err)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGiftModal && (
          <GiftModal
            isOpen={showGiftModal}
            onClose={() => setShowGiftModal(false)}
            profile={profile}
            onGiftSuccess={() => console.log('Gift sent successfully')}
            onGiftError={(err) => console.error('Gift error:', err)}
          />
        )}
      </AnimatePresence>

      <HowToVote
        isOpen={showHowToVote}
        onClose={() => setShowHowToVote(false)}
        candidateName={profile.username || ''}
        onVoteNow={() => setShowVoteModal(true)}
      />
    </div>
  );
}