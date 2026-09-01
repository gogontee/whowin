// app/policy/page.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Check, AlertCircle, ChevronDown, ChevronUp, FileText, Info, ArrowLeft, Users, Heart, Gift, DollarSign, Lock, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const PolicyPage = () => {
  const router = useRouter();
  const [policy, setPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from('about_meta')
          .select('policy')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching policy:', error.message);
          setPolicy('');
        } else if (data?.policy) {
          setPolicy(data.policy);
        } else {
          setPolicy('');
        }
      } catch (error) {
        console.error('Error fetching policy:', error);
        setPolicy('');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Parse policy text into sections
  const parsePolicySections = (text) => {
    if (!text) return [];
    
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if line is a section header (starts with number and dot, or is all caps)
      const isHeader = /^\d+\./.test(line) || 
                       (line === line.toUpperCase() && line.length > 3 && !line.includes('.'));

      if (isHeader) {
        // Save previous section
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        currentSection = line;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      } else {
        // If no section started yet, treat as intro
        if (!sections.length && !currentSection) {
          currentSection = 'Introduction';
          currentContent = [line];
        } else if (currentSection === 'Introduction') {
          currentContent.push(line);
        }
      }
    }

    // Save last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  };

  // Get icon for section title
  const getSectionIcon = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('entertainment')) return <Heart className="w-4 h-4 text-pink-400" />;
    if (lower.includes('voting')) return <Check className="w-4 h-4 text-blue-400" />;
    if (lower.includes('gift')) return <Gift className="w-4 h-4 text-purple-400" />;
    if (lower.includes('payment') || lower.includes('refund')) return <DollarSign className="w-4 h-4 text-green-400" />;
    if (lower.includes('security') || lower.includes('fraud')) return <Lock className="w-4 h-4 text-yellow-400" />;
    if (lower.includes('responsibility') || lower.includes('acceptance')) return <Users className="w-4 h-4 text-orange-400" />;
    if (lower.includes('introduction')) return <Info className="w-4 h-4 text-blue-400" />;
    if (lower.includes('applies')) return <Users className="w-4 h-4 text-cyan-400" />;
    if (lower.includes('guaranteed')) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    return <FileText className="w-4 h-4 text-white/40" />;
  };

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const policySections = parsePolicySections(policy);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 mt-4 text-sm">Loading policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 pt-24 pb-16">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-green-500/5 to-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      <main className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500/20 to-yellow-500/20 rounded-lg border border-green-500/30">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
                      Users Policy
                    </span>
                  </h1>
                  <p className="text-white/40 text-sm mt-1">
                    Effective: September 2024
                  </p>
                </div>
              </div>
              <p className="text-white/60 text-sm md:text-base">
                This Users Policy explains the rules and conditions that apply to everyone who uses the WHO WIN platform.
              </p>
            </div>

            {/* Policy Sections */}
            {policySections.length > 0 ? (
              <div className="space-y-3">
                {policySections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-white/5 rounded-lg border transition-all ${
                      expandedSection === index 
                        ? 'border-green-500 ring-1 ring-green-500/50' 
                        : 'border-white/10 hover:border-green-500/30'
                    }`}
                  >
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getSectionIcon(section.title)}
                        <span className={`text-sm font-semibold text-left ${
                          expandedSection === index ? 'text-white' : 'text-white/80'
                        }`}>
                          {section.title}
                        </span>
                      </div>
                      {expandedSection === index ? (
                        <ChevronUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedSection === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-white/10">
                            <p className="text-xs sm:text-sm text-white/70 leading-relaxed whitespace-pre-line">
                              {section.content}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-sm">No policy content available.</p>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-8 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60">
                  By accessing or using WHO WIN, you acknowledge that you have read, understood, and agreed to this Users Policy.
                  If you do not agree with this policy, you should not use the voting or gifting features of the platform.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/40 text-center">
                Questions? Contact us at{' '}
                <a href="mailto:info@whowinshow.com" className="text-green-400 hover:text-green-300 transition-colors">
                  info@whowinshow.com
                </a>
              </p>
            </div>

            {/* Last Updated */}
            <div className="mt-6 text-center text-white/20 text-xs">
              <p>© 2024 Who Wins Show. All rights reserved.</p>
              <p className="mt-1">Last updated: September 2024</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PolicyPage;