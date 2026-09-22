// /components/profile/VoteModal.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Loader, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export default function VoteModal({ 
  isOpen, 
  onClose, 
  profile, 
  onVoteSuccess,
  onVoteError 
}) {
  const [voteCount, setVoteCount] = useState(50);
  const [customVotes, setCustomVotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ email: '', name: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentStep, setPaymentStep] = useState('selection');
  const [error, setError] = useState('');
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Payment error state for custom popup
  const [paymentError, setPaymentError] = useState({
    show: false,
    type: '',
    message: '',
    suggestion: ''
  });

  // Minimum-votes alert popup
  const [minVotesAlert, setMinVotesAlert] = useState(false);

  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  // Price per vote in Naira
  const PRICE_PER_VOTE_NGN = 100;
  const MIN_VOTES = 5;

  // Quick vote presets
  const quickVotes = [20, 50, 100, 200, 500, 1000];

  // Check user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    if (isOpen) {
      checkUser();
    }
  }, [isOpen, supabase]);

  // Load Paystack script
  useEffect(() => {
    if (isOpen && !paystackLoaded) {
      if (window.PaystackPop) {
        setPaystackLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      
      script.onload = () => {
        if (window.PaystackPop) {
          setPaystackLoaded(true);
        }
      };
      
      document.head.appendChild(script);
    }
  }, [isOpen, paystackLoaded]);

  const handlePaystackError = (err) => {
    console.error('Paystack error:', err);
    setProcessing(false);

    const errorString = JSON.stringify(err || {}).toLowerCase();

    let errorType = 'processing';
    let userMessage = 'Payment failed. Please try again.';
    let suggestion = 'Try again or contact support if the issue persists.';

    if (errorString.includes('declined') || errorString.includes('denied')) {
      errorType = 'declined';
      userMessage = 'Your card was declined.';
      suggestion = 'Please try a different card or check with your bank.';
    } else if (errorString.includes('network') || errorString.includes('connection')) {
      errorType = 'network';
      userMessage = 'Network error occurred.';
      suggestion = 'Please check your internet connection and try again.';
    }

    setPaymentError({
      show: true,
      type: errorType,
      message: userMessage,
      suggestion: suggestion
    });

    setError(userMessage);
  };

  // ---- Vote selection handlers ----
  const handleQuickVoteSelect = (votes) => {
    setVoteCount(votes);
    setCustomVotes('');
  };

  const handleCustomVoteChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomVotes(raw);
    if (raw) {
      setVoteCount(parseInt(raw, 10));
    } else {
      setVoteCount(MIN_VOTES);
    }
  };

  // ---- Paystack payment processing ----
  const processPaystackPayment = () => {
    if (!window.PaystackPop) {
      setError('Payment system not loaded.');
      setProcessing(false);
      return;
    }

    const email = currentUser?.email || guestInfo.email;
    if (!email) {
      setError('Email is required for payment');
      setProcessing(false);
      return;
    }

    const name = currentUser?.user_metadata?.full_name || guestInfo.name || 'Voter';
    const totalAmountInNaira = voteCount * PRICE_PER_VOTE_NGN;
    const amountInKobo = Math.round(totalAmountInNaira * 100);
    const reference = `VOTE_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amountInKobo,
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Voter Name", variable_name: "voter_name", value: name },
            { display_name: "Candidate", variable_name: "candidate", value: profile?.username },
            { display_name: "Votes", variable_name: "votes", value: voteCount.toString() },
          ],
        },
        callback: (response) => {
          handlePaymentSuccess(response, totalAmountInNaira, email, name);
        },
        onClose: () => {
          setProcessing(false);
          setError('Payment cancelled');
        }
      });

      handler.openIframe();
    } catch (error) {
      handlePaystackError(error);
    }
  };

  // ---- Payment success ----
  const handlePaymentSuccess = async (response, totalAmount, email, name) => {
    setPaymentStep('processing');
    
    try {
      const voteData = {
        user_id: currentUser?.id || null,
        guest_email: !currentUser ? email : null,
        guest_name: !currentUser ? name : null,
        candidate_id: profile.id,
        package_name: `${voteCount} Votes Package`,
        votes: voteCount,
        price_per_vote: PRICE_PER_VOTE_NGN,
        total_amount: totalAmount,
        payment_method: 'paystack',
        payment_provider: 'paystack',
        payment_id: response.reference || response.id,
        reference: response.reference || response.id,
        status: 'completed',
        metadata: {
          currency: 'NGN',
        },
      };

      const { error: insertError } = await supabase
        .from('vote_transactions')
        .insert(voteData);

      if (insertError) throw insertError;

      setPaymentStep('success');
      setProcessing(false);

      const totalFormatted = `₦${totalAmount.toLocaleString()}`;

      if (onVoteSuccess) {
        onVoteSuccess(voteCount, totalFormatted);
      }

      setTimeout(() => {
        resetModal();
        onClose();
      }, 3000);

    } catch (error) {
      setError('Payment verification failed.');
      setPaymentStep('selection');
      setProcessing(false);
      if (onVoteError) onVoteError(error.message);
    }
  };

  const processPayment = () => {
    // Only show the minimum-votes alert when Pay is clicked with < MIN_VOTES
    if (voteCount < MIN_VOTES) {
      setMinVotesAlert(true);
      return;
    }

    if (!currentUser && !guestInfo.email) {
      setError('Please enter your email address');
      return;
    }

    if (!paystackLoaded) {
      setError('Payment system is loading. Please wait...');
      return;
    }

    setProcessing(true);
    setError('');
    setPaymentStep('processing');
    processPaystackPayment();
  };

  const resetModal = () => {
    setVoteCount(50);
    setCustomVotes('');
    setGuestInfo({ email: '', name: '' });
    setError('');
    setPaymentStep('selection');
    setProcessing(false);
    setPaymentError({ show: false, type: '', message: '', suggestion: '' });
    setMinVotesAlert(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const totalNGN = (voteCount * PRICE_PER_VOTE_NGN).toLocaleString();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 pb-24 overflow-y-auto bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-600 to-yellow-500 sticky top-0 z-10">
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-current" />
                Vote for {profile?.username}
              </h2>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-yellow-500 border-2 border-white/30">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {paymentStep === 'success' ? (
                <div className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white mb-1">Vote Cast Successfully!</h3>
                  <p className="text-white/60 text-xs mb-3">
                    You've voted {voteCount} time{voteCount > 1 ? 's' : ''} for @{profile?.username}
                  </p>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-orange-400 font-semibold text-sm">
                      Total: ₦{totalNGN}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Quick Vote Buttons */}
                  <div className="p-3 border-b border-white/10">
                    <label className="block text-xs font-medium text-white/80 mb-2">
                      Quick Vote for @{profile?.username}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {quickVotes.map((votes) => (
                        <button
                          key={votes}
                          onClick={() => handleQuickVoteSelect(votes)}
                          className={`p-2 rounded-lg border transition-all ${
                            voteCount === votes && !customVotes
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                        >
                          <span className="block text-base font-bold text-white">{votes}</span>
                          <span className="text-[10px] text-white/40">votes</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Vote Input */}
                  <div className="p-3 border-b border-white/10">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customVotes}
                      onChange={handleCustomVoteChange}
                      placeholder="Enter number of votes you want to cast"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-base text-white placeholder-white/40 focus:border-orange-500 focus:outline-none transition-colors text-center"
                    />
                  </div>

                  {/* Vote Summary */}
                  <div className="p-3 border-b border-white/10">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/60">Votes:</span>
                        <span className="text-xl font-bold text-white">{voteCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/60">Total:</span>
                        <span className="text-white/80">₦{totalNGN}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Info (email only shown for guests) */}
                  {!currentUser && (
                    <div className="p-3 border-b border-white/10 space-y-2">
                      <label className="block text-xs font-medium text-white/80">
                        Your Information
                      </label>
                      <input
                        type="email"
                        placeholder="Email address *"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-orange-500 focus:outline-none transition-colors"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* Paystack Badge */}
                  <div className="px-3 py-2">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <span className="text-green-400 text-xs">✓ Secure payment via Paystack</span>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-3 py-1">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <div className="p-3">
                    <button
                      onClick={processPayment}
                      disabled={processing}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Pay ₦${totalNGN} with Paystack`
                      )}
                    </button>

                    <p className="text-[10px] text-white/40 text-center mt-2">
                      By proceeding, you agree to our Terms of Service
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* ===== Minimum Votes Alert Popup ===== */}
          <AnimatePresence>
            {minVotesAlert && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setMinVotesAlert(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-yellow-500/30 p-6 max-w-sm w-full shadow-2xl"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white text-center mb-2">
                    Minimum Votes Required
                  </h3>

                  <p className="text-white/80 text-center text-sm mb-6 leading-relaxed">
                    The least number of votes you can cast is{' '}
                    <span className="text-[#C58B2A] font-bold">{MIN_VOTES} votes</span>.
                    Please enter {MIN_VOTES} or more to continue.
                  </p>

                  <button
                    onClick={() => setMinVotesAlert(false)}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C58B2A] to-yellow-500 text-black font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Got it
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===== Payment Error Popup ===== */}
          <AnimatePresence>
            {paymentError.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setPaymentError({ ...paymentError, show: false })}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/10 p-6 max-w-md w-full"
                >
                  <div className="flex items-center justify-center mb-4">
                    {paymentError.type === 'declined' && (
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    )}
                    {paymentError.type === 'network' && (
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    )}
                    {paymentError.type === 'processing' && (
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-purple-400" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white text-center mb-2">
                    Payment Failed
                  </h3>

                  <p className="text-white/80 text-center mb-4">
                    {paymentError.message}
                  </p>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
                    <p className="text-sm text-white/60 text-center">
                      💡 {paymentError.suggestion}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setPaymentError({ ...paymentError, show: false })}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Try Again
                    </button>

                    <button
                      onClick={() => {
                        setPaymentError({ ...paymentError, show: false });
                        handleClose();
                      }}
                      className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}