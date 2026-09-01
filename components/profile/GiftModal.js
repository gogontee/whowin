// /components/profile/GiftModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Check, AlertCircle, CreditCard, DollarSign, ChevronRight, Gift, Heart, Sparkles, Crown, Diamond, Trophy, Flower, Star } from 'lucide-react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';

// Ring icon as custom SVG
const RingIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M12 2v4" />
    <path d="M12 14v8" />
    <path d="M8 12l2-2" />
    <path d="M16 12l-2-2" />
  </svg>
);

// Gift definitions with colors
const GIFTS = [
  { 
    id: 'flower', 
    name: 'Flower', 
    emoji: '🌹', 
    amount: 20000,
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    icon: Flower
  },
  { 
    id: 'blow_kisses', 
    name: 'Blow Kisses', 
    emoji: '😘', 
    amount: 50000,
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    icon: Heart
  },
  { 
    id: 'silver_ring', 
    name: 'Silver Ring', 
    emoji: '💍', 
    amount: 100000,
    color: 'from-gray-300 to-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-400/30',
    textColor: 'text-gray-300',
    icon: RingIcon
  },
  { 
    id: 'love', 
    name: 'Love', 
    emoji: '❤️', 
    amount: 300000,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-500',
    icon: Heart
  },
  { 
    id: 'heart', 
    name: 'Heart', 
    emoji: '💖', 
    amount: 250000,
    color: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    icon: Heart
  },
  { 
    id: 'golden_ring', 
    name: 'Golden Ring', 
    emoji: '💛', 
    amount: 350000,
    color: 'from-yellow-400 to-amber-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: RingIcon
  },
  { 
    id: 'trophy', 
    name: 'Trophy', 
    emoji: '🏆', 
    amount: 500000,
    color: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    icon: Trophy
  },
  { 
    id: 'crown', 
    name: 'Crown', 
    emoji: '👑', 
    amount: 700000,
    color: 'from-yellow-400 to-gold-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: Crown
  },
  { 
    id: 'dragon', 
    name: 'Dragon', 
    emoji: '🐉', 
    amount: 1000000,
    color: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    icon: Diamond
  },
];
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

export default function GiftModal({ 
  isOpen, 
  onClose, 
  profile, 
  onGiftSuccess,
  onGiftError 
}) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ email: '', name: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentStep, setPaymentStep] = useState('selection');
  const [error, setError] = useState('');
  const [shouldScroll, setShouldScroll] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  
  const [paymentError, setPaymentError] = useState({
    show: false,
    type: '',
    message: '',
    suggestion: ''
  });

  const currencySelectionRef = useRef(null);
  const proceedButtonRef = useRef(null);
  const paypalButtonContainerRef = useRef(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const USD_TO_NGN = 1500;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    if (isOpen) {
      checkUser();
    }
  }, [isOpen, supabase]);

  useEffect(() => {
    if (isOpen && !paystackLoaded && selectedCurrency === 'NGN') {
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
  }, [isOpen, paystackLoaded, selectedCurrency]);

  useEffect(() => {
    if (isOpen && selectedCurrency === 'USD' && !paypalReady && !paypalLoading) {
      loadPayPalScript();
    }
  }, [isOpen, selectedCurrency, paypalReady, paypalLoading]);

  const loadPayPalScript = () => {
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    setPaypalLoading(true);
    
    const existingScript = document.getElementById('paypal-sdk');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.id = 'paypal-sdk';
    
    script.onload = () => {
      setPaypalReady(true);
      setPaypalLoading(false);
    };
    
    script.onerror = () => {
      setError('Failed to load PayPal. Please try again.');
      setPaypalLoading(false);
    };
    
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (paypalReady && selectedCurrency === 'USD' && paypalButtonContainerRef.current && selectedGift) {
      paypalButtonContainerRef.current.innerHTML = '';
      
      const totalAmountUSD = (selectedGift.amount / USD_TO_NGN).toFixed(2);
      const email = currentUser?.email || guestInfo.email || 'guest@example.com';
      const reference = `GIFT_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      try {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 45
          },
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{
                description: `${selectedGift.emoji} ${selectedGift.name} gift for @${profile?.username}`,
                amount: {
                  currency_code: 'USD',
                  value: totalAmountUSD
                },
                custom_id: reference,
                invoice_id: reference
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW'
              }
            });
          },
          onApprove: async (data, actions) => {
            setProcessing(true);
            try {
              const order = await actions.order.capture();
              const totalAmountUSD = parseFloat(order.purchase_units[0].amount.value);
              const totalAmountNGN = totalAmountUSD * USD_TO_NGN;
              
              await handlePaymentSuccess(
                { reference: order.id },
                totalAmountNGN,
                email,
                guestInfo.name || 'Guest',
                'paypal',
                'paypal',
                { paypal_response: order }
              );
            } catch (err) {
              handlePayPalError(err);
            }
          },
          onError: (err) => {
            handlePayPalError(err);
          },
          onCancel: () => {
            setPaymentError({
              show: true,
              type: 'cancelled',
              message: 'Payment was cancelled.',
              suggestion: 'You can try again or choose a different payment method.'
            });
            setProcessing(false);
          }
        }).render(paypalButtonContainerRef.current);
        
      } catch (error) {
        setPaymentError({
          show: true,
          type: 'processing',
          message: 'Failed to initialize payment.',
          suggestion: 'Please refresh and try again.'
        });
      }
    }
  }, [paypalReady, selectedCurrency, selectedGift, profile, currentUser, guestInfo]);

  const handlePayPalError = (err) => {
    console.error('Full PayPal error:', err);
    setProcessing(false);
    
    const errorString = JSON.stringify(err).toLowerCase();
    
    let errorType = 'processing';
    let userMessage = 'Payment failed. Please try again.';
    let suggestion = 'Try a different payment method or card.';
    
    if (errorString.includes('declined') || 
        errorString.includes('payment_denied') ||
        errorString.includes('instrument_declined')) {
      errorType = 'declined';
      userMessage = 'Your card was declined.';
      suggestion = 'Please try a different card or use your PayPal balance.';
    }
    else if (errorString.includes('card_type') || 
             errorString.includes('unsupported')) {
      errorType = 'card_type';
      userMessage = 'This card type is not supported.';
      suggestion = 'Please use Visa, Mastercard, or American Express.';
    }
    else if (errorString.includes('account') || 
             errorString.includes('restricted') ||
             errorString.includes('verify')) {
      errorType = 'account';
      userMessage = 'There is an issue with the merchant account.';
      suggestion = 'Please try again later or contact support.';
    }
    else if (errorString.includes('network') || 
             errorString.includes('connection')) {
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

  useEffect(() => {
    if (shouldScroll && !showCurrencySelection && proceedButtonRef.current) {
      const timer = setTimeout(() => {
        proceedButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShouldScroll(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    
    if (shouldScroll && showCurrencySelection && currencySelectionRef.current) {
      const timer = setTimeout(() => {
        currencySelectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShouldScroll(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldScroll, showCurrencySelection]);

  const handleGiftSelect = (gift) => {
    setSelectedGift(gift);
    setError('');
    setTimeout(() => setShouldScroll(true), 200);
  };

  const handleProceedToCurrency = () => {
    if (!selectedGift) {
      setError('Please select a gift');
      return;
    }
    setShowCurrencySelection(true);
    setError('');
    setTimeout(() => setShouldScroll(true), 100);
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setError('');
  };

  const handleBackToGiftSelection = () => {
    setShowCurrencySelection(false);
    setSelectedCurrency(null);
    setError('');
  };

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

    const name = currentUser?.user_metadata?.full_name || guestInfo.name || 'Guest';
    const amountInKobo = Math.round(selectedGift.amount * 100);
    const reference = `GIFT_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amountInKobo,
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Gift Sender", variable_name: "sender_name", value: name },
            { display_name: "Recipient", variable_name: "recipient", value: profile?.username },
            { display_name: "Gift", variable_name: "gift", value: `${selectedGift.emoji} ${selectedGift.name}` },
          ],
        },
        callback: (response) => {
          handlePaymentSuccess(response, selectedGift.amount, email, name, 'paystack', 'paystack');
        },
        onClose: () => {
          setProcessing(false);
          setError('Payment cancelled');
        }
      });

      handler.openIframe();
    } catch (error) {
      setError('Failed to initialize payment.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response, totalAmount, email, name, provider, method, additionalData = {}) => {
    setPaymentStep('processing');
    
    try {
      const giftData = {
        user_id: currentUser?.id || null,
        guest_email: !currentUser ? email : null,
        guest_name: !currentUser ? name : null,
        candidate_id: profile.id,
        gift_type: selectedGift.id,
        gift_name: selectedGift.name,
        gift_emoji: selectedGift.emoji,
        amount: totalAmount,
        payment_method: method,
        payment_provider: provider,
        payment_id: response.reference || response.order_id || response.id,
        reference: response.reference || response.order_id || response.id,
        status: 'completed',
        metadata: {
          currency: provider === 'paypal' ? 'USD' : 'NGN',
          ...additionalData,
        },
      };

      const { error: insertError } = await supabase
        .from('gift_transactions')
        .insert(giftData);

      if (insertError) throw insertError;

      setPaymentStep('success');
      setProcessing(false);

      const totalFormatted = provider === 'paypal' 
        ? `$${(totalAmount / USD_TO_NGN).toFixed(2)}` 
        : `₦${totalAmount.toLocaleString()}`;

      if (onGiftSuccess) {
        onGiftSuccess(selectedGift, totalFormatted);
      }

      setTimeout(() => {
        resetModal();
        onClose();
      }, 3000);

    } catch (error) {
      setError('Payment verification failed.');
      setPaymentStep('selection');
      setProcessing(false);
      if (onGiftError) onGiftError(error.message);
    }
  };

  const processPayment = () => {
    if (!selectedCurrency) {
      setError('Please select a currency');
      return;
    }

    if (selectedCurrency === 'NGN') {
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
    }
  };

  const resetModal = () => {
    setSelectedGift(null);
    setShowCurrencySelection(false);
    setSelectedCurrency(null);
    setGuestInfo({ email: '', name: '' });
    setError('');
    setPaymentStep('selection');
    setProcessing(false);
    setPaymentError({ show: false, type: '', message: '', suggestion: '' });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Get gift color classes
  const getGiftColorClasses = (gift, isSelected) => {
    if (isSelected) {
      return `border-transparent ring-2 ring-${gift.color.split('-')[1]}-500`;
    }
    return `border-white/10 hover:border-${gift.color.split('-')[1]}-500/50`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalUSD = selectedGift ? (selectedGift.amount / USD_TO_NGN).toFixed(2) : '0.00';
  const totalNGN = selectedGift ? selectedGift.amount.toLocaleString() : '0';

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
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-gold-500/20 to-yellow-500/20 sticky top-0 z-10">
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-yellow-400" />
                Send a Gift to @{profile?.username}
              </h2>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-gold-500 border-2 border-white/30">
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
                      <Gift className="w-4 h-4 text-white" />
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
                  <h3 className="text-lg font-bold text-white mb-1">Gift Sent Successfully!</h3>
                  <p className="text-white/60 text-sm mb-3">
                    You sent {selectedGift?.emoji} {selectedGift?.name} to @{profile?.username}
                  </p>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-yellow-400 font-semibold text-sm">
                      Total: {selectedCurrency === 'USD' ? `$${totalUSD}` : `₦${totalNGN}`}
                    </p>
                  </div>
                </div>
              ) : showCurrencySelection ? (
                <div ref={currencySelectionRef}>
                  {/* Gift Summary */}
                  <div className="p-3 border-b border-white/10">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <p className="text-4xl mb-1">{selectedGift?.emoji}</p>
                      <p className="text-lg font-bold text-white mb-0.5">{selectedGift?.name}</p>
                      <p className="text-xs text-white/60">
                        {formatCurrency(selectedGift?.amount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="p-3 border-b border-white/10">
                    <label className="block text-xs font-medium text-white/80 mb-2">
                      Choose your currency
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCurrencySelect('NGN')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                          selectedCurrency === 'NGN'
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <span className={`text-xl font-bold ${selectedCurrency === 'NGN' ? 'text-yellow-500' : 'text-white/60'}`}>₦</span>
                        <span className="font-bold text-white text-sm">Naira</span>
                        <span className="text-xs text-white/40">₦{totalNGN}</span>
                      </button>
                      <button
                        onClick={() => handleCurrencySelect('USD')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                          selectedCurrency === 'USD'
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <DollarSign className={`w-6 h-6 ${selectedCurrency === 'USD' ? 'text-yellow-500' : 'text-white/60'}`} />
                        <span className="font-bold text-white text-sm">US Dollar</span>
                        <span className="text-xs text-white/40">${totalUSD}</span>
                      </button>
                    </div>
                  </div>

                  {/* NGN Payment */}
                  {selectedCurrency === 'NGN' && (
                    <>
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
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-yellow-500 focus:outline-none transition-colors"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={guestInfo.name}
                            onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-yellow-500 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      <div className="px-3 py-1">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                          <span className="text-green-400 text-xs">✓ Pay with Paystack</span>
                        </div>
                      </div>

                      {error && (
                        <div className="px-3 py-1">
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                            <p className="text-xs text-red-400">{error}</p>
                          </div>
                        </div>
                      )}

                      <div className="p-3">
                        <button
                          onClick={processPayment}
                          disabled={processing || (!currentUser && !guestInfo.email)}
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
                      </div>
                    </>
                  )}

                  {/* USD Payment */}
                  {selectedCurrency === 'USD' && (
                    <div className="p-3 border-b border-white/10">
                      {!currentUser && (
                        <div className="mb-3 space-y-2">
                          <input
                            type="email"
                            placeholder="Email (optional)"
                            value={guestInfo.email}
                            onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-yellow-500 focus:outline-none transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={guestInfo.name}
                            onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:border-yellow-500 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      {paypalLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader className="w-5 h-5 text-yellow-500 animate-spin" />
                          <span className="text-xs text-white/60 ml-2">Loading PayPal...</span>
                        </div>
                      ) : paypalReady ? (
                        <>
                          <div 
                            ref={paypalButtonContainerRef} 
                            className="min-h-[100px] w-full"
                          />
                          <p className="text-xs text-white/40 text-center mt-2">
                            Pay with PayPal account or credit/debit card
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-red-400">PayPal failed to load.</p>
                          <button
                            onClick={loadPayPalScript}
                            className="mt-2 text-xs text-yellow-400 hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {error && (
                        <div className="mt-3 px-3 py-1">
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                            <p className="text-xs text-red-400">{error}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Back Button */}
                  <div className="p-3">
                    <button
                      onClick={handleBackToGiftSelection}
                      className="w-full py-2 bg-white/5 text-white rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      ← Back to Gift Selection
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Gift Grid */}
                  <div className="p-3 border-b border-white/10">
                    <label className="block text-xs font-medium text-white/80 mb-2">
                      Choose a Gift for @{profile?.username}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {GIFTS.map((gift) => {
                        const isSelected = selectedGift?.id === gift.id;
                        const IconComponent = gift.icon;
                        return (
                          <button
                            key={gift.id}
                            onClick={() => handleGiftSelect(gift)}
                            className={`p-3 rounded-xl border transition-all relative group ${
                              isSelected
                                ? `border-transparent ring-2 ring-${gift.color.split('-')[1]}-500 bg-${gift.color.split('-')[1]}-500/10`
                                : `${gift.bgColor} ${gift.borderColor} hover:bg-white/10`
                            }`}
                          >
                            <div className="text-2xl mb-1">{gift.emoji}</div>
                            <div className={`text-xs font-medium text-white/80 ${isSelected ? 'text-white' : ''}`}>
                              {gift.name}
                            </div>
                            <div className={`text-[8px] ${gift.textColor}`}>
                              {formatCurrency(gift.amount)}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-black" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Gift Summary */}
                  {selectedGift && (
                    <div className="p-3 border-b border-white/10">
                      <div className={`rounded-lg p-3 ${selectedGift.bgColor} border ${selectedGift.borderColor}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{selectedGift.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{selectedGift.name}</p>
                            <p className="text-xs text-white/60">Amount: {formatCurrency(selectedGift.amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="px-3 py-1">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Proceed Button */}
                  <div ref={proceedButtonRef} className="p-3">
                    <button
                      onClick={handleProceedToCurrency}
                      disabled={!selectedGift}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-opacity flex items-center justify-center gap-1 group ${
                        selectedGift
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:opacity-90'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
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

          {/* Payment Error Popup */}
          <AnimatePresence>
            {paymentError.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setPaymentError({...paymentError, show: false})}
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
                    {paymentError.type === 'card_type' && (
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {paymentError.type === 'account' && (
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                    {paymentError.type === 'cancelled' && (
                      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                      onClick={() => setPaymentError({...paymentError, show: false})}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Try Again
                    </button>
                    
                    {paymentError.type !== 'account' && (
                      <button
                        onClick={() => {
                          setPaymentError({...paymentError, show: false});
                          handleBackToGiftSelection();
                        }}
                        className="w-full py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
                      >
                        Choose Different Payment Method
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setPaymentError({...paymentError, show: false});
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