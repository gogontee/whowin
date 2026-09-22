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
  HelpCircle,
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
  // Share helpers — copy vote link only
  // ============================================================
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${username}/voteprofile`;
  };

  const getShareMessage = () => {
    const name = (profile?.username || '').toUpperCase() || 'ME';
    return `Hello, I am participating in the Who Wins Reality Show Season 2.
Please help vote for me — I need votes to qualify.

Click the link below to vote

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

  // Compact profile card (country badge removed)
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

      {/* Profile photo */}
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

  // ---- DESKTOP action bar: Copy on left, How to Vote on right ----
  const ActionBarDesktop = (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-3 flex items-center justify-between gap-3">
      <button
        onClick={handleCopyLink}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy Vote Link</span>
          </>
        )}
      </button>

      <button
        onClick={() => setShowHowToVote(true)}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black text-xs font-bold hover:opacity-90 transition-opacity"
      >
        <HelpCircle className="w-4 h-4" />
        <span>How to Vote</span>
      </button>
    </div>
  );

  // ---- MOBILE action bar: stacked ----
  const ActionBarMobile = (
    <div className="w-full border-y border-white/10 bg-black/60 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-3 py-2.5 space-y-2">
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 flex-shrink-0" />
              <span>Copy Vote Link</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowHowToVote(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>How to Vote</span>
        </button>
      </div>
    </div>
  );

  // ---- Bulk vote image ----
  const BulkVoteImage = (
    <div className="w-full">
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-gray-900">
        <Image
          src="/bulkvote.png"
          alt="Bulk vote"
          width={1200}
          height={800}
          className="w-full h-auto object-contain"
          priority
          sizes="(max-width: 768px) 100vw, 500px"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:block">
        <div className="container mx-auto px-6 pt-8 pb-10 max-w-5xl">
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* LEFT column — profile card + action bar */}
            <div className="space-y-4">
              {ProfileCard}
              {ActionBarDesktop}
            </div>

            {/* RIGHT column — bulk vote image */}
            <div>
              {BulkVoteImage}
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
          {ActionBarMobile}
        </div>

        <div className="container mx-auto px-4 mt-3">
          {BulkVoteImage}
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