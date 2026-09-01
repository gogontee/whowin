// app/adminpannel/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ChevronLeft,
  Shield,
  Users,
  UserCog,
  Loader,
  AlertCircle,
  Image as ImageIcon,
  Mail,
  Gift,
  FileText
} from 'lucide-react';

// Import components
import AccessModal from '../../components/admin/AccessModal';
import ProfileManagement from '../../components/admin/ProfileManagement';
import VotersView from '../../components/admin/VotersView';
import CelebMedia from '../../components/admin/CelebMedia';
import MessagePortal from '../../components/MessagePortal';
import GiftTransactions from '../../components/admin/GiftTransactions';
import AboutMetaManagement from '../../components/admin/AboutMetaManagement';

export default function AdminPanelPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profiles');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // Refs for silent refresh
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check admin status and session on load
  useEffect(() => {
    const checkAdminSession = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile?.role !== 'admin') {
          router.push('/');
          return;
        }

        setIsAdmin(true);

        // Check if admin access is already stored in session
        const storedAccess = sessionStorage.getItem('admin_access_granted');
        
        if (storedAccess === 'true') {
          // Access already granted this session
          setAccessGranted(true);
          setShowAccessModal(false);
          await fetchData();
        } else {
          // Need to enter access code
          setShowAccessModal(true);
          setAccessGranted(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, [router, supabase]);

  // Fetch data when access is granted
  useEffect(() => {
    if (accessGranted) {
      fetchData();
    }
  }, [accessGranted]);

  // Start silent refresh when access is granted
  useEffect(() => {
    if (accessGranted && isAdmin) {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Start silent refresh every 5 seconds
      refreshIntervalRef.current = setInterval(() => {
        silentRefresh();
      }, 5000);
      
      console.log('🔄 Silent refresh started (every 5 seconds)');
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        console.log('🔄 Silent refresh stopped');
      }
    };
  }, [accessGranted, isAdmin]);

  const fetchData = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      await fetchUnreadMessagesCount();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Silent refresh - updates data without affecting UI
  const silentRefresh = async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    try {
      // Only refresh if the component is still mounted and admin
      if (!accessGranted || !isAdmin) {
        isRefreshingRef.current = false;
        return;
      }

      // Update total count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (count !== null && count !== undefined) {
        setTotalCount(count);
      }

      // Update unread messages count
      await fetchUnreadMessagesCount();
      
      // Log refresh (optional - remove in production)
      console.log('🔄 Silent refresh completed at', new Date().toLocaleTimeString());
      
    } catch (error) {
      // Silent fail - don't show errors to user
      console.debug('Silent refresh error:', error.message);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Set up real-time subscription for messages (in addition to silent refresh)
  useEffect(() => {
    if (accessGranted && isAdmin) {
      const subscription = supabase
        .channel('get_in_touch_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'get_in_touch' 
          }, 
          () => {
            // Refresh unread count when messages change
            fetchUnreadMessagesCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [accessGranted, isAdmin]);

  const fetchUnreadMessagesCount = async () => {
    try {
      const { count, error } = await supabase
        .from('get_in_touch')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

      if (error) throw error;
      setUnreadMessagesCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  };

  const handleAccessGranted = () => {
    setAccessGranted(true);
    setShowAccessModal(false);
  };

  // Clear admin session on logout or tab close
  const clearAdminSession = () => {
    sessionStorage.removeItem('admin_access_granted');
    sessionStorage.removeItem('admin_access_time');
    
    // Stop silent refresh
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-burnt-orange-500 animate-spin" />
      </div>
    );
  }

  if (showAccessModal) {
    return <AccessModal onAccessGranted={handleAccessGranted} />;
  }

  if (!isAdmin || !accessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-burnt-orange-950 to-black">
      {/* ===== STICKY HEADER - Stays below GlobalNavigation ===== */}
      <div className="sticky top-16 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={clearAdminSession}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-burnt-orange-400" />
                  Admin Panel
                </h1>
                <p className="text-xs text-white/40">
                  {activeTab === 'profiles' ? `${totalCount} total users` : 
                   activeTab === 'voters' ? 'View all transactions' : 
                   activeTab === 'gifts' ? 'View all gift transactions' :
                   activeTab === 'media' ? 'Manage celebrity media content' :
                   activeTab === 'about' ? 'Manage About page content' :
                   `${unreadMessagesCount} unread messages`}
                </p>
              </div>
            </div>

            {/* Toggle buttons */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab('profiles')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'profiles'
                    ? 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Profiles
                </span>
              </button>
              <button
                onClick={() => setActiveTab('voters')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'voters'
                    ? 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Voters
                </span>
              </button>
              <button
                onClick={() => setActiveTab('gifts')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'gifts'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4" />
                  Gifts
                </span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'media'
                    ? 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Media
                </span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative ${
                  activeTab === 'messages'
                    ? 'bg-gradient-to-r from-burnt-orange-500 to-yellow-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Messages
                  {unreadMessagesCount > 0 && activeTab !== 'messages' && (
                    <span className="absolute -top-1 -right-1 sm:relative sm:top-0 sm:right-0 sm:ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                  {unreadMessagesCount > 0 && activeTab === 'messages' && (
                    <span className="ml-1 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadMessagesCount}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'about'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                style={{ minHeight: '48px' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  About
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT - With padding to account for sticky header ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'profiles' ? (
          <ProfileManagement />
        ) : activeTab === 'voters' ? (
          <VotersView />
        ) : activeTab === 'gifts' ? (
          <GiftTransactions />
        ) : activeTab === 'media' ? (
          <CelebMedia />
        ) : activeTab === 'about' ? (
          <AboutMetaManagement />
        ) : (
          <MessagePortal />
        )}
      </div>
    </div>
  );
}