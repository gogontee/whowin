// app/terms/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Check, AlertCircle, LogIn, UserPlus, ChevronDown, ChevronUp, Info, AlertTriangle, FileText } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const TermsPage = () => {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedWarning, setExpandedWarning] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check if user is authenticated and get profile
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('accept_terms, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          // If user has already accepted terms, check the box
          if (profile.accept_terms === true) {
            setAcceptedTerms(true);
          }
        }
      }
    };
    getUser();
  }, []);

  // Fetch warnings from about_meta
  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const { data, error } = await supabase
          .from('about_meta')
          .select('warning')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching warnings:', error.message);
          setWarnings([]);
        } else if (data?.warning && Array.isArray(data.warning)) {
          setWarnings(data.warning);
        } else {
          setWarnings([]);
        }
      } catch (error) {
        console.error('Error fetching warnings:', error);
        setWarnings([]);
      } finally {
        setContentLoading(false);
      }
    };

    fetchWarnings();
  }, []);

  // Data array for the terms
  const termsData = [
    {
      id: 1,
      icon: '🪪',
      title: 'Eligibility & Age Verification',
      desc: 'Participants must be 18 years or older at application. Valid government-issued ID required for final selection. Must be legally able to reside and travel within Nigeria for the 3-week filming. No felony convictions or pending criminal cases. Must be single, divorced, or legally separated (no current marital commitments). Not currently in a serious, exclusive relationship that would conflict with show format.'
    },
    {
      id: 2,
      icon: '🎥',
      title: 'Consent to Film & Broadcast',
      desc: 'You grant Who Wins Show irrevocable rights to film, record, and photograph you 24/7 during production. The show contains adult content including romantic situations, intimate conversations, and mature themes. Footage may be used in perpetuity across all media platforms worldwide (broadcast, streaming, social media, promotional materials). No additional compensation beyond Winner\'s prize and gifts. You waive the right to inspect or approve final content. Production may use your name, likeness, voice, and biographical information for promotional purposes.'
    },
    {
      id: 3,
      icon: '🧠',
      title: 'Psychological & Emotional Considerations',
      desc: 'Participants must be mentally and emotionally prepared for reality TV pressures. Psychological evaluation required before final selection (at production\'s expense). The show involves emotional situations, potential conflict, and public scrutiny. Production may remove participants whose mental health is at risk. Production shall not be held liable for any mental health issues or emotional harm arising from participation. You acknowledge that online harassment and media attention are possible during and after broadcast.'
    },
    {
      id: 4,
      icon: '🤫',
      title: 'Confidentiality & Non-Disclosure',
      desc: 'Comprehensive NDA must be signed upon Candidate arrival at the show mansion.'
    },
    {
      id: 5,
      icon: '📱',
      title: 'Social Media & Public Conduct',
      desc: 'Who Wins Show is not responsible for online harassment or media scrutiny. You may be required to participate in show promotional activities on your social channels.'
    },
    {
      id: 6,
      icon: '🔍',
      title: 'Background Verification',
      desc: 'All finalists consent to comprehensive background check (criminal, employment, social media). Previous reality TV appearances must be disclosed. Production may utilise external events surrounding the candidate for the purpose of the show.'
    },
    {
      id: 7,
      icon: '🏥',
      title: 'Medical & Physical Requirements',
      desc: 'Activities may include physical challenges and long filming hours. Production provides emergency medical care but is not liable for pre-existing conditions. You consent to emergency medical treatment if necessary. Must disclose any medical conditions that could affect participation.'
    },
    {
      id: 8,
      icon: '🚫',
      title: 'Substance Use Policy',
      desc: 'No hard drug use permitted during filming. Prescription medications must be disclosed to production if needed. Smoking/vaping restricted to designated areas and times.'
    },
    {
      id: 9,
      icon: '❤️',
      title: 'Romantic Relationships & Conduct',
      desc: 'Relationships formed during the show may be portrayed for entertainment. Participants must respect boundaries and consent at all times. Physical harassment may attract immediate expulsion. Production may intervene in situations compromising safety. Intimate moments may be filmed and broadcast.'
    },
    {
      id: 10,
      icon: '📅',
      title: 'Post-Show Obligations',
      desc: 'Selected participants may be required for promotional activities (interviews, events, social media). Exclusive media rights apply for 12 months after broadcast. Cannot participate in competing reality shows for 12 months. Must maintain confidentiality about unaired content.'
    },
    {
      id: 11,
      icon: '⚖️',
      title: 'Disclaimer of Liability',
      desc: 'Who Wins Show is not liable for emotional distress, reputation damage, or other participation consequences. You assume all risks associated with public exposure and media portrayal. Show\'s portrayal at sole discretion of producers and editors. No guarantee of airtime or specific portrayal.'
    },
    {
      id: 12,
      icon: '💰',
      title: 'Compensation & Expenses',
      desc: 'Accommodation, meals, and refreshments provided during production. Consolation prizes for runner-ups shall rest on the discretion of producers. The winner\'s prize is ₦19M worth of prizes, awarded as producers determine. Half of gifts accumulated by participants during filming shall be given to the candidate at the end of the show season; half is retained by Who Wins Show. Travel to filming location from the mansion during production at producer\'s expense unless otherwise agreed.'
    }
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const toggleWarning = (index) => {
    setExpandedWarning(expandedWarning === index ? null : index);
  };

  const handleAcceptAndProceed = async () => {
    if (!acceptedTerms) {
      setShowAcceptModal(true);
      return;
    }

    // If user already accepted terms, show message
    if (userProfile?.accept_terms === true) {
      alert('You have already accepted the terms and conditions.');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ accept_terms: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile({ ...userProfile, accept_terms: true });
      alert('Terms accepted successfully!');

      // Redirect to application page
      router.push('/apply');
    } catch (error) {
      console.error('Error updating terms acceptance:', error);
      alert('Failed to update terms acceptance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isTermsAccepted = userProfile?.accept_terms === true;
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 pt-24 pb-16">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-green-500/5 to-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Terms Content */}
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                  Terms & Conditions
                </span>
              </h1>
              <p className="text-white/60 text-sm md:text-base">
                Please read carefully before proceeding with your application. Click on any card to read the full terms.
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link
                href="/policy"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all border border-white/10"
              >
                <FileText className="w-4 h-4" />
                Read Our Policy
              </Link>
            </div>

            {/* Age verification banner */}
            <div className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 border-l-4 border-green-500 rounded-lg p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">🔞</span>
              <div>
                <strong className="text-green-400 text-sm md:text-base block">MUST BE 18 YEARS OR OLDER</strong>
                <span className="text-white/60 text-xs md:text-sm">Valid government ID will be required on arrival to the camp · No exceptions</span>
              </div>
            </div>

            {/* Prize Card */}
            <div className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 rounded-lg p-4 mb-6 border border-yellow-500/30 inline-block">
              <span className="text-white/60 text-xs uppercase tracking-wider block">Grand Prize</span>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                ₦19M
              </span>
              <span className="text-white/40 text-xs block mt-1">Worth of Prizes + Gifts & Consolation</span>
            </div>

            {/* Warnings Section - from about_meta */}
            {warnings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Important Notices
                </h2>
                <div className="space-y-2">
                  {warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="bg-yellow-500/5 rounded-lg border border-yellow-500/20 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleWarning(index)}
                        className="w-full flex items-center justify-between p-3 hover:bg-yellow-500/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Info className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-white">{warning.title}</span>
                        </div>
                        {expandedWarning === index ? (
                          <ChevronUp className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-yellow-400/60 flex-shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedWarning === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 border-t border-yellow-500/10">
                              <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                                {warning.content}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terms grid - Expandable cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
              {termsData.map((term) => (
                <motion.div
                  key={term.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: term.id * 0.02 }}
                  className={`bg-white/5 rounded-lg border transition-all cursor-pointer ${
                    expandedCard === term.id 
                      ? 'border-green-500 ring-1 ring-green-500/50' 
                      : 'border-white/10 hover:border-green-500/30'
                  }`}
                  onClick={() => toggleCard(term.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{term.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">{term.title}</h3>
                          {expandedCard === term.id ? (
                            <ChevronUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                        
                        <AnimatePresence>
                          {expandedCard === term.id ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-white/80 mt-3 leading-relaxed">
                                {term.desc}
                              </p>
                            </motion.div>
                          ) : (
                            <p className="text-xs text-white/60 mt-1 line-clamp-2">
                              {term.desc}
                            </p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Key highlights */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
              {[
                { icon: '📋', text: 'Valid ID' },
                { icon: '🧪', text: 'Psych Evaluation' },
                { icon: '🏥', text: 'Medical' },
                { icon: '🤫', text: 'NDA' },
                { icon: '📱', text: 'Social Media' },
                { icon: '⚖️', text: 'Liability' }
              ].map((item, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                  <span className="text-xl block mb-1">{item.icon}</span>
                  <span className="text-[10px] md:text-xs text-white/60">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Important notice */}
            <div className="bg-green-500/5 rounded-lg p-4 mb-6 border border-green-500/20">
              <div className="flex gap-3">
                <span className="text-green-400 text-xl">⚠️</span>
                <p className="text-xs md:text-sm text-white/80">
                  By proceeding, you acknowledge that you have read and agree to all terms. 
                  Who Wins Show reserves the right to modify these terms with reasonable notice.
                </p>
              </div>
            </div>

            {/* Acceptance section */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              {isAuthenticated && isTermsAccepted ? (
                // Already accepted
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-400 font-semibold">
                      You have already accepted the Terms & Conditions.
                    </span>
                  </div>
                  <button
                    disabled={true}
                    className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Already Accepted
                  </button>
                </div>
              ) : isAuthenticated ? (
                // Authenticated but not accepted
                <>
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="text-sm text-white">
                      I have read and agree to the Terms & Conditions
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/about"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all text-center"
                    >
                      Back to About
                    </Link>
                    <button
                      onClick={handleAcceptAndProceed}
                      disabled={loading || !acceptedTerms}
                      className={`flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-yellow-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all ${
                        !acceptedTerms ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Accept & Continue
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // Not authenticated
                <>
                  <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-xs text-yellow-400">
                      ⚠️ As long as you continue using this platform, it means that you have accepted all terms and the platform policy.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/about"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all text-center"
                    >
                      Back to About
                    </Link>
                    <Link
                      href="/auth/login"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-yellow-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Login to Accept
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-white/30 text-xs">
              <p>© 2024 Who Wins Show. All rights reserved.</p>
              <p>Version 1.0 · Last updated September 2024</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Accept Terms Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 text-yellow-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Accept Terms Required</h3>
            </div>
            <p className="text-white/80 mb-6">
              Please read and accept the Terms & Conditions before proceeding.
            </p>
            <button
              onClick={() => setShowAcceptModal(false)}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-yellow-500 text-white rounded-lg font-semibold"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}

      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 text-green-500 mb-4">
              <LogIn className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Authentication Required</h3>
            </div>
            <p className="text-white/80 mb-6">
              Please login or create an account to continue with your application.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-yellow-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </Link>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TermsPage;