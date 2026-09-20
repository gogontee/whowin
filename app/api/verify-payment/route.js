// /components/profile/VoteModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Loader, Check, AlertCircle, CreditCard, DollarSign, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

const PaymentIcon = ({ provider }) => {
  switch(provider) {
    case 'paystack':
      return <span className="text-green-400 font-bold text-base">₦</span>;
    case 'paypal':
      return <span className="text-blue-400 font-bold text-base">$</span>;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

export default function VoteModal({ 
  isOpen, 
  onClose, 
  profile, 
  onVoteSuccess,
  onVoteError 
}) {
  const [voteCount, setVoteCount] = useState(50);
  const [customVotes, setCustomVotes] = useState('');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ email: '', name: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentStep, setPaymentStep] = useState('selection');
  const [error, setError] = useState('');
  const [shouldScroll, setShouldScroll] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Refs
  const currencySelectionRef = useRef(null);
  const proceedButtonRef = useRef(null);
  const scriptLoadedRef = useRef(false); // Prevent multiple script loads

  // Paystack public key from env
  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  // Exchange rates
  const USD_TO_NGN = 1500;
  const PRICE_PER_VOTE_USD = 1;
  const PRICE_PER_VOTE_NGN = PRICE_PER_VOTE_USD * USD_TO_NGN;

  const quickVotes = [50, 100, 300, 500, 700, 1000];

  // Load Paystack v1 script only once
  useEffect(() => {
    // Only run if modal is open and script not loaded
    if (isOpen && !paystackLoaded && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      
      // Check if already loaded
      if (window.PaystackPop) {
        console.log('Paystack v1 already loaded');
        setPaystackLoaded(true);
        return;
      }

      // Create script element for v1
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Paystack v1 script loaded');
        // Small delay to ensure PaystackPop is fully initialized
        setTimeout(() => {
          if (window.PaystackPop) {
            console.log('PaystackPop found!');
            setPaystackLoaded(true);
          } else {
            console.error('PaystackPop not found after script load');
            setError('Failed to initialize payment system. Please refresh.');
          }
        }, 500);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Paystack script:', error);
        setError('Failed to load payment system. Please check your connection.');
        scriptLoadedRef.current = false;
      };
      
      document.head.appendChild(script);
      
      // Cleanup function
      return () => {
        // Don't remove the script as it might be needed, but reset the loaded state
        // when modal closes
        if (!isOpen) {
          // Keep scriptLoadedRef true to prevent reloading, but we can reset if needed
        }
      };
    }
  }, [isOpen, paystackLoaded]);

  // Reset script loaded ref when modal closes completely
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow modal to close before resetting
      const timer = setTimeout(() => {
        scriptLoadedRef.current = false;
        setPaystackLoaded(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldScroll && !showCurrencySelection && proceedButtonRef.current) {
      const timer = setTimeout(() => {
        proceedButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        setShouldScroll(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    if (shouldScroll && showCurrencySelection && currencySelectionRef.current) {
      const timer = setTimeout(() => {
        currencySelectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        setShouldScroll(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [shouldScroll, showCurrencySelection]);

  const handleQuickVoteSelect = (votes) => {
    setVoteCount(votes);
    setCustomVotes('');
    setTimeout(() => setShouldScroll(true), 2000);
  };

  const handleCustomVoteChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCustomVotes(value);
    if (value) {
      setVoteCount(parseInt(value));
      setTimeout(() => setShouldScroll(true), 2500);
    }
  };

  const handleProceedToCurrency = () => {
    if (voteCount < 1) {
      setError('Please select or enter a valid number of votes');
      return;
    }
    setShowCurrencySelection(true);
    setError('');
    setTimeout(() => setShouldScroll(true), 100);
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
  };

  const handleBackToVoteSelection = () => {
    setShowCurrencySelection(false);
    setSelectedCurrency(null);
    setError('');
  };

  // Paystack v1 payment processing
  const processPaystackPayment = () => {
    // Check if PaystackPop is available (v1)
    if (!window.PaystackPop) {
      setError('Payment system not loaded. Please refresh the page.');
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
    
    // Calculate total amount in Naira
    const totalAmountInNaira = voteCount * PRICE_PER_VOTE_NGN;
    
    // Convert to kobo (multiply by 100) for Paystack
    const amountInKobo = Math.round(totalAmountInNaira * 100);
    
    const reference = `VOTE_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    console.log('Initializing Paystack v1 with:', {
      email,
      amountInKobo,
      amountInNaira: totalAmountInNaira,
      currency: 'NGN',
      reference
    });

    try {
      // Initialize Paystack v1 transaction using PaystackPop
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amountInKobo,
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Voter Name",
              variable_name: "voter_name",
              value: name,
            },
            {
              display_name: "Candidate",
              variable_name: "candidate",
              value: profile?.username || 'Unknown',
            },
            {
              display_name: "Votes",
              variable_name: "votes",
              value: voteCount.toString(),
            },
          ],
        },
        callback: (response) => {
          console.log('Payment successful:', response);
          handlePaymentSuccess(response, totalAmountInNaira);
        },
        onClose: () => {
          console.log('Payment cancelled');
          setProcessing(false);
          setError('Payment cancelled');
        }
      });

      // Open the payment modal
      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
      } else {
        console.error('Handler or openIframe not available');
        setError('Failed to open payment modal. Please try again.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Paystack initialization error:', error);
      setError('Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response, totalAmountInNaira) => {
    setPaymentStep('processing');
    
    try {
      const voteData = {
        user_id: currentUser?.id || null,
        guest_email: !currentUser ? guestInfo.email : null,
        guest_name: !currentUser ? guestInfo.name || null : null,
        candidate_id: profile.id,
        package_name: `${voteCount} Votes Package`,
        votes: voteCount,
        price_per_vote: PRICE_PER_VOTE_NGN,
        total_amount: totalAmountInNaira,
        discount_percentage: 0,
        original_amount: totalAmountInNaira,
        payment_method: 'paystack',
        payment_provider: 'paystack',
        payment_id: response.reference,
        reference: response.reference,
        status: 'completed',
        metadata: {
          currency: 'NGN',
          paystack_response: response,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        ip_address: '0.0.0.0',
        user_agent: navigator.userAgent
      };

      const { error: insertError } = await supabase
        .from('vote_transactions')
        .insert(voteData);

      if (insertError) throw insertError;

      // Update candidate's vote count
      const { error: updateError } = await supabase.rpc('increment_votes', {
        candidate_id: profile.id,
        vote_count: voteCount
      });

      if (updateError) {
        console.error('Error updating vote count:', updateError);
      }

      setPaymentStep('success');

      const totalInNGN = `₦${totalAmountInNaira.toLocaleString()}`;

      if (onVoteSuccess) {
        onVoteSuccess(voteCount, totalInNGN);
      }

      setTimeout(() => {
        resetModal();
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Vote processing error:', error);
      setError(error.message || 'Payment verification failed. Please contact support.');
      setPaymentStep('selection');
      if (onVoteError) {
        onVoteError(error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = () => {
    if (!selectedCurrency) {
      setError('Please select a currency');
      return;
    }

    if (selectedCurrency === 'USD') {
      setError('USD payments coming soon. Please use NGN for now.');
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

    if (selectedCurrency === 'NGN') {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        processPaystackPayment();
      }, 100);
    } else {
      setError('Selected payment method is not yet available');
      setProcessing(false);
    }
  };

  const resetModal = () => {
    setVoteCount(50);
    setCustomVotes('');
    setShowCurrencySelection(false);
    setSelectedCurrency(null);
    setGuestInfo({ email: '', name: '' });
    setError('');
    setPaymentStep('selection');
    setProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const totalUSD = (voteCount * PRICE_PER_VOTE_USD).toFixed(2);
  const totalNGN = (voteCount * PRICE_PER_VOTE_NGN).toLocaleString();

  // Return your JSX here (same as before, I'll keep it concise)
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
                {/* Profile Photo */}
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
                
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Scrollable Content - Keep your existing JSX here */}
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
                      Total: {selectedCurrency === 'USD' ? `$${totalUSD}` : `₦${totalNGN}`}
                    </p>
                  </div>
                </div>
              ) : showCurrencySelection ? (
                /* Currency Selection Step */
                <div ref={currencySelectionRef}>
                  {/* Vote Summary */}
                  <div className="p-3 border-b border-white/10">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-white/60 mb-0.5">You are about to cast</p>
                      <p className="text-3xl font-bold text-white mb-1">{voteCount}</p>
                      <p className="text-xs text-white/60">votes for @{profile?.username}</p>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="p-3 border-b border-white/10">
                    <label className="block text-xs font-medium text-white/80 mb-2">
                      Choose your currency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCurrencySelect('USD')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                          selectedCurrency === 'USD'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <DollarSign className={`w-6 h-6 ${selectedCurrency === 'USD' ? 'text-orange-500' : 'text-white/60'}`} />
                        <span className="font-bold text-white text-sm">USD</span>
                        <span className="text-xs text-white/40">${totalUSD}</span>
                      </button>
                      <button
                        onClick={() => handleCurrencySelect('NGN')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                          selectedCurrency === 'NGN'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <span className={`text-xl font-bold ${selectedCurrency === 'NGN' ? 'text-orange-500' : 'text-white/60'}`}>₦</span>
                        <span className="font-bold text-white text-sm">NGN</span>
                        <span className="text-xs text-white/40">₦{totalNGN}</span>
                      </button>
                    </div>
                  </div>

                  {/* Guest Info */}
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
                  {selectedCurrency === 'NGN' && (
                    <div className="px-3 py-1">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-center gap-2">
                        <span className="text-green-400 text-xs">✓ Secure payment via Paystack</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="px-3 py-1">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-3 space-y-2">
                    <button
                      onClick={processPayment}
                      disabled={processing || !selectedCurrency || (!currentUser && !guestInfo.email)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-3 h-3 fill-current" />
                          <span>Proceed to Payment</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleBackToVoteSelection}
                      className="w-full py-1.5 bg-white/5 text-white rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      ← Back to Vote Selection
                    </button>
                  </div>
                </div>
              ) : (
                /* Vote Selection Step */
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
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Or enter custom number
                    </label>
                    <input
                      type="text"
                      value={customVotes}
                      onChange={handleCustomVoteChange}
                      placeholder="Enter number of votes"
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
                        <span className="text-white/60">Approximate value:</span>
                        <span className="text-white/80">${totalUSD} / ₦{totalNGN}</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="px-3 py-1">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Proceed Button */}
                  <div ref={proceedButtonRef} className="p-3">
                    <button
                      onClick={handleProceedToCurrency}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 group"
                    >
                      <span>Proceed to Payment</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <p className="text-[10px] text-white/40 text-center mt-2">
                      By proceeding, you agree to our Terms of Service
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}