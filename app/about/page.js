// app/about/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Twitter, Facebook, Youtube, 
  Send, Mail, Phone, MapPin, Globe, 
  Heart, Star, Trophy, Users, Camera, Mic,
  ChevronRight, ChevronLeft, X, Check,
  Award, Sparkles, Clock, Calendar, Shield,
  MessageCircle, Download, Share2, Tv,
  UserPlus, Settings, AlertCircle, PartyPopper,
  Crown, DollarSign, Loader, ChevronDown,
  Eye, Target, Flag
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AboutPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);
  const [aboutData, setAboutData] = useState({
    full_description: '',
    vision: '',
    mission: '',
    goal: '',
    telephone: '',
    whatsapp_line: ''
  });

  // Fallback values
  const FALLBACKS = {
    full_description: `WhoWin is Africa's premier celebrity reality show where stars compete in challenges, showcase their talents, and battle for the ultimate crown. From intense competitions to unforgettable moments, witness your favorite celebrities go head-to-head in the most thrilling entertainment spectacle on the continent.

Now in its 1st season, the show brings together exceptional young people from across Africa into one house life in spotlight. From singers and dancers to comedians and performers, WhoWin provides a platform for raw talent to shine on the biggest stage with millions of viewers across the continent and worldwide.`,
    vision: 'To become Africa\'s most celebrated reality show that discovers and celebrates exceptional talent while creating unforgettable entertainment experiences.',
    mission: 'To provide a platform where celebrities can showcase their talents, connect with fans, and compete in a fair and exciting environment that pushes them to their limits.',
    goal: 'To create a sustainable entertainment ecosystem that identifies, nurtures, and celebrates talent while delivering premium entertainment content to millions of viewers across Africa.',
    telephone: '+2349034408120',
    whatsapp_line: '+2348094167132'
  };

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState(null);
  const [formError, setFormError] = useState('');

  // Banner images from public folder
  const bannerImages = [
    '/banner1.jpeg',
    '/banner2.jpeg',
    '/banner3.jpg',
  ];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch about data
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const { data, error } = await supabase
          .from('about_meta')
          .select('full_description, vision, mission, goal, telephone, whatsapp_line')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching about data:', error.message);
          setAboutData({
            full_description: FALLBACKS.full_description,
            vision: FALLBACKS.vision,
            mission: FALLBACKS.mission,
            goal: FALLBACKS.goal,
            telephone: FALLBACKS.telephone,
            whatsapp_line: FALLBACKS.whatsapp_line
          });
        } else if (data) {
          setAboutData({
            full_description: data.full_description || FALLBACKS.full_description,
            vision: data.vision || FALLBACKS.vision,
            mission: data.mission || FALLBACKS.mission,
            goal: data.goal || FALLBACKS.goal,
            telephone: data.telephone || FALLBACKS.telephone,
            whatsapp_line: data.whatsapp_line || FALLBACKS.whatsapp_line
          });
        } else {
          setAboutData({
            full_description: FALLBACKS.full_description,
            vision: FALLBACKS.vision,
            mission: FALLBACKS.mission,
            goal: FALLBACKS.goal,
            telephone: FALLBACKS.telephone,
            whatsapp_line: FALLBACKS.whatsapp_line
          });
        }
      } catch (error) {
        console.error('Error fetching about data:', error);
        setAboutData({
          full_description: FALLBACKS.full_description,
          vision: FALLBACKS.vision,
          mission: FALLBACKS.mission,
          goal: FALLBACKS.goal,
          telephone: FALLBACKS.telephone,
          whatsapp_line: FALLBACKS.whatsapp_line
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, [supabase]);

  // Auto-slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Updated tabs
  const tabs = [
    { id: 'about', label: 'About', icon: Star },
    { id: 'how-it-works', label: 'How It Works', icon: Trophy },
    { id: 'prizes', label: 'Prizes', icon: Award },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  // Animation variants
  const tabContentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.3 }
    }
  };

  const floatingTabVariants = {
    initial: { y: 0 },
    hover: { 
      y: -3,
      transition: { type: 'spring', stiffness: 400, damping: 10 }
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setFormError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (!formData.message.trim()) {
      setFormError('Message is required');
      return false;
    }
    return true;
  };

  // Handle form submission to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setFormStatus('sending');
    setFormError('');

    try {
      const { error } = await supabase
        .from('get_in_touch')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            message: formData.message,
            status: 'unread',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setFormStatus('success');
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        message: ''
      });

      setTimeout(() => setFormStatus(null), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setFormStatus('error');
      setFormError('Failed to send message. Please try again.');
      
      setTimeout(() => {
        setFormStatus(null);
        setFormError('');
      }, 5000);
    }
  };

  // Social media links
  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/whowin', label: 'Instagram', color: 'from-purple-500 to-pink-500' },
    { icon: Twitter, href: 'https://twitter.com/whowin', label: 'Twitter', color: 'from-blue-400 to-blue-600' },
    { icon: Facebook, href: 'https://facebook.com/whowin', label: 'Facebook', color: 'from-blue-600 to-blue-800' },
    { icon: Youtube, href: 'https://youtube.com/whowin', label: 'YouTube', color: 'from-red-500 to-red-700' },
    { icon: Send, href: 'https://t.me/whowin', label: 'Telegram', color: 'from-blue-500 to-cyan-500' },
    { icon: MessageCircle, href: `https://wa.me/${aboutData.whatsapp_line.replace('+', '')}`, label: 'WhatsApp', color: 'from-green-500 to-green-600' },
  ];

  // How It Works steps - updated with 45 housemates
  const howItWorksSteps = [
    {
      step: 1,
      title: 'Create Account',
      desc: 'Create your account on WhoWin Portal, add your photos, and complete your profile using the settings button on your page',
      icon: UserPlus,
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: 2,
      title: 'Priority Challenge',
      desc: 'Get active in the Priority Challenge. This challenge determines who will make up the 45 housemates in WhoWin Mansion',
      icon: AlertCircle,
      color: 'from-yellow-500 to-amber-500'
    },
    {
      step: 3,
      title: 'Top Candidates',
      desc: 'Top candidates shall be announced on all WhoWin platforms. If you make it to the house, congratulations in advance!',
      icon: PartyPopper,
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: 4,
      title: 'Live Show',
      desc: 'The show shall be full of life! The public shall determine who gets evicted and who stays through votes. Get ready for the battle of stars',
      icon: Tv,
      color: 'from-yellow-500 to-amber-500'
    },
    {
      step: 5,
      title: 'Grand Final',
      desc: 'One winner shall emerge as the STAR OF AFRICA. You have what it takes, so don\'t dull!',
      icon: Crown,
      color: 'from-green-500 to-emerald-500'
    },
    {
      step: 6,
      title: 'Star Prize',
      desc: 'A whopping ₦19M worth of prizes for the winner and lots of consolation prizes!',
      icon: DollarSign,
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  const toggleStep = (step) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 pt-16 sm:pt-20 pb-16 sm:pb-24">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-48 sm:w-72 h-48 sm:h-72 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-4 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-r from-green-500/5 to-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
              WhoWin
            </span>
            <br className="sm:hidden" />
            <span className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Reality Show Africa</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Africa's biggest talent showcase. Where stars are born and dreams come true.
          </p>
        </motion.div>

        {/* Navbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8"
        >
          <Link
            href="/terms"
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md text-xs font-semibold shadow-lg shadow-green-500/30 flex items-center gap-1 hover:scale-105 transition-transform whitespace-nowrap"
          >
            <Shield className="w-3 h-3" />
            <span>Terms</span>
          </Link>

          <motion.a
            href={`https://wa.me/${aboutData.whatsapp_line.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md text-xs font-semibold shadow-lg shadow-green-500/30 flex items-center gap-1 whitespace-nowrap"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-md text-xs font-semibold flex items-center gap-1 hover:bg-white/20 transition-all whitespace-nowrap"
          >
            <Download className="w-3 h-3" />
            <span>Brochure</span>
          </motion.button>

          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              variants={floatingTabVariants}
              initial="initial"
              whileHover="hover"
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 sm:px-3 py-1 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1">
                <tab.icon className="w-3 h-3" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8"
          >
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">About WhoWin Africa</h2>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-sm sm:text-base text-white/80 leading-relaxed whitespace-pre-line">
                      {aboutData.full_description}
                    </div>
                  </div>
                  <div className="relative h-48 sm:h-64 md:h-auto rounded-lg sm:rounded-xl overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentBanner}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={bannerImages[currentBanner]}
                          alt={`WhoWin Banner ${currentBanner + 1}`}
                          fill
                          className="object-cover"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                      {bannerImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBanner(idx)}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            idx === currentBanner ? 'w-4 bg-green-500' : 'w-1.5 bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`Go to banner ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vision, Mission, Goal Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-bold text-white">Our Vision</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      {aboutData.vision}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <h3 className="text-sm font-bold text-white">Our Mission</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      {aboutData.mission}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-bold text-white">Our Goal</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      {aboutData.goal}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works Tab - Collapsible */}
            {activeTab === 'how-it-works' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">How It Works</h2>
                <div className="space-y-3">
                  {howItWorksSteps.map((item) => (
                    <div key={item.step} className="border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleStep(item.step)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold text-xs sm:text-sm">{item.step}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color.includes('green') ? 'text-green-400' : 'text-yellow-400'}`} />
                            <span className="text-sm sm:text-base font-semibold text-white">{item.title}</span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedStep === item.step ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 ${expandedStep === item.step ? 'text-green-400' : 'text-white/40'}`} />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedStep === item.step && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 sm:p-4 pt-0 bg-white/5 border-t border-white/5">
                              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                                {item.desc}
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

            {/* Prizes Tab - Gold Theme */}
            {activeTab === 'prizes' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Prizes & Rewards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {/* Grand Prize - Gold */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gradient-to-b from-yellow-500/20 to-amber-500/20 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-yellow-500/30 text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                      <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">Grand Prize</h3>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400 mb-1">₦19M</div>
                    <p className="text-[10px] sm:text-xs text-white/60">Worth of Prizes + Consolation</p>
                  </motion.div>

                  {/* Consolation Prizes - Light Gold */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gradient-to-b from-yellow-400/10 to-amber-400/10 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-yellow-400/20 text-center"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                      <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">Consolation</h3>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-300 mb-1">Multiple</div>
                    <p className="text-[10px] sm:text-xs text-white/60">Prizes for top finalists</p>
                  </motion.div>

                  {/* Special Awards - Dark Gold */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="bg-gradient-to-b from-amber-500/10 to-yellow-600/10 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-amber-500/20 text-center sm:col-span-2 md:col-span-1"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                      <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">Special Awards</h3>
                    <div className="text-sm sm:text-base text-amber-400 mb-1">Weekly Prizes</div>
                    <p className="text-[10px] sm:text-xs text-white/60">Fan Favorite, Best Performance</p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Get in Touch</h2>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  {/* Contact Form */}
                  <div className="space-y-3 sm:space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-white/80 text-xs sm:text-sm mb-1">
                          Full Name <span className="text-green-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your full name"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-white placeholder-white/40 focus:border-green-500 focus:outline-none transition"
                          disabled={formStatus === 'sending'}
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-xs sm:text-sm mb-1">
                          Email <span className="text-green-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter your email address"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-white placeholder-white/40 focus:border-green-500 focus:outline-none transition"
                          disabled={formStatus === 'sending'}
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-xs sm:text-sm mb-1">
                          Phone <span className="text-white/40 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-white placeholder-white/40 focus:border-green-500 focus:outline-none transition"
                          disabled={formStatus === 'sending'}
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-xs sm:text-sm mb-1">
                          Message <span className="text-green-400">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          placeholder="Write your message here..."
                          rows="4"
                          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-sm sm:text-base text-white placeholder-white/40 focus:border-green-500 focus:outline-none transition resize-none"
                          disabled={formStatus === 'sending'}
                        ></textarea>
                      </div>

                      {/* Error Message */}
                      <AnimatePresence>
                        {formError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg"
                          >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{formError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={formStatus === 'sending'}
                        className="w-full py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formStatus === 'sending' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : formStatus === 'success' ? (
                          <>
                            <Check className="w-4 h-4" />
                            Message Sent!
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </motion.button>

                      <p className="text-xs text-white/40 text-center">
                        <span className="text-green-400">*</span> Required fields
                      </p>
                    </form>
                  </div>

                  {/* Contact Info & Social Media */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4">Contact Information</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span className="truncate">info@whowinshow.com</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span>{aboutData.telephone}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span>Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span className="truncate">whowinshow.com</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-white/10">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4">Follow Us</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {socialLinks.map((social) => (
                          <motion.a
                            key={social.label}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -2 }}
                            className={`p-2 sm:p-3 rounded-lg bg-gradient-to-r ${social.color} flex items-center justify-center`}
                          >
                            <social.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Social Media Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-1.5 sm:gap-2"
        >
          {socialLinks.map((social) => (
            <motion.a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${social.color} shadow-lg`}
              title={social.label}
            >
              <social.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  );
}