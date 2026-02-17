import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Request } from '../lib/types';
import { useBackButton } from '../lib/useBackButton';
import { isAndroid } from '../lib/capacitor';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, familyMemberships } = useAuth();
  const { currentFamily, isParent, isHelper, isHelperMode, subscription, clearHelperFamily } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useBackButton();

  useEffect(() => {
    if (!currentFamily || !user) return;

    const fetchOpenRequests = async () => {
      const { data } = await supabase
        .from('requests')
        .select('id, last_action_by')
        .eq('family_id', currentFamily.id)
        .in('status', ['OPEN', 'COUNTERED']);

      const myOpenRequests = (data || []).filter(
        (req: Request) => req.last_action_by !== user.id
      );
      setOpenRequestsCount(myOpenRequests.length);
    };

    fetchOpenRequests();

    const subscription = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          fetchOpenRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentFamily, user]);

  const fetchUnreadMessages = useCallback(async () => {
    if (!currentFamily || !user) return;

    const { data } = await supabase
      .from('helper_messages')
      .select('id, recipient_id, sender_id, status, closed, parent_message_id, created_at, has_responded_users')
      .eq('family_id', currentFamily.id)
      .is('parent_message_id', null);

    if (!data) {
      setUnreadMessagesCount(0);
      return;
    }

    const messagesWithReplies = await Promise.all(
      data.map(async (msg: any) => {
        const { data: replies } = await supabase
          .from('helper_messages')
          .select('id, sender_id, recipient_id, status, created_at, has_responded_users')
          .eq('parent_message_id', msg.id)
          .order('created_at', { ascending: true });

        return {
          ...msg,
          replies: replies || [],
        };
      })
    );

    const actionableCount = messagesWithReplies.filter(message => {
      if (message.closed) return false;

      const isParentGroupMessage = message.recipient_id === null;

      let needsMyResponse = false;
      if (message.status === 'MOET_BEANTWOORDEN') {
        if (message.recipient_id === user.id) {
          needsMyResponse = true;
        } else if (isParentGroupMessage && message.sender_id !== user.id && !isHelperMode) {
          const iHaveReplied = message.replies?.some((r: any) => r.sender_id === user.id);
          needsMyResponse = !iHaveReplied;
        }
      } else if (message.status === 'BEANTWOORD') {
        if (isParentGroupMessage && message.sender_id !== user.id && !isHelperMode) {
          const iHaveReplied = message.replies?.some((r: any) => r.sender_id === user.id);
          needsMyResponse = !iHaveReplied;
        }
      }

      const hasRepliesThatNeedMyResponse = message.replies?.some((r: any) => {
        if (r.status !== 'MOET_BEANTWOORDEN') return false;

        if (isHelperMode && isParentGroupMessage) {
          return false;
        }

        if (r.recipient_id === user.id) {
          return true;
        } else if (r.recipient_id === null && r.sender_id !== user.id && !isHelperMode) {
          const iHaveReplied = message.replies?.some((reply: any) => reply.sender_id === user.id);
          needsMyResponse = !iHaveReplied;
        }
        return false;
      });

      return needsMyResponse || hasRepliesThatNeedMyResponse;
    }).length;

    setUnreadMessagesCount(actionableCount);
  }, [currentFamily, user, isHelperMode]);

  useEffect(() => {
    fetchUnreadMessages();
  }, [fetchUnreadMessages]);

  useEffect(() => {
    if (!currentFamily) return;

    const subscription = supabase
      .channel('helper_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'helper_messages',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentFamily, fetchUnreadMessages]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleBackToFamilies = () => {
    if (isHelperMode) {
      clearHelperFamily();
      navigate('/helper-families');
    } else {
      navigate('/families');
    }
  };

  const navigation = isHelperMode
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Kinderen', href: '/kinderen', icon: Users },
        { name: 'Agenda', href: '/agenda', icon: Calendar },
        { name: 'Logboek', href: '/logboek', icon: BookOpen },
        { name: 'Verzoeken', href: '/verzoeken', icon: MessageSquare },
        { name: 'Vragen', href: '/vragen', icon: HelpCircle, badge: unreadMessagesCount },
        { name: 'Instellingen', href: '/instellingen', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Kinderen', href: '/kinderen', icon: Users },
        { name: 'Agenda', href: '/agenda', icon: Calendar },
        { name: 'Logboek', href: '/logboek', icon: BookOpen },
        { name: 'Verzoeken', href: '/verzoeken', icon: MessageSquare, badge: openRequestsCount },
        { name: 'Hulpverleners', href: '/hulpverleners', icon: HelpCircle, badge: unreadMessagesCount },
        { name: 'Export', href: '/export', icon: Download },
        { name: 'Instellingen', href: '/instellingen', icon: Settings },
      ];

  const isActive = (href: string) => location.pathname === href;

  if (!currentFamily && location.pathname !== '/families' && location.pathname !== '/helper-families') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Geen gezin geselecteerd</h2>
          <button
            onClick={handleBackToFamilies}
            className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            {isHelperMode ? 'Gezinnen bekijken' : 'Gezinnen beheren'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200" style={isAndroid() ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <img
                  src="/ChatGPT_Image_17_feb_2026,_09_48_08.png"
                  alt="CoParenting Logo"
                  className="w-8 h-8 object-contain"
                />
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-900 leading-tight">CoParenting</div>
                  <div className="text-[10px] text-gray-600 font-medium -mt-0.5">-samen opvoeden-</div>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {isHelperMode && currentFamily && (
                <div className="mr-4 flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                  <span className="font-semibold">{currentFamily.name}</span>
                  <button
                    onClick={handleBackToFamilies}
                    className="underline hover:text-blue-900"
                  >
                    Wijzigen
                  </button>
                </div>
              )}
              {subscription && !isHelperMode && (
                <div className="mr-4 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                  {subscription.plan}
                </div>
              )}
              <Link
                to="/account"
                className="text-sm text-gray-600 hover:text-gray-900 mr-4"
              >
                {user?.name}
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:relative z-50 md:z-auto w-64 bg-white border-r border-gray-200 md:min-h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out`}
        >
          <nav className="p-3 space-y-0.5">
            {familyMemberships.length > 1 && !isHelperMode && (
              <Link
                to="/families"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Users className="w-5 h-5" />
                <span>Gezinnen</span>
              </Link>
            )}
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg relative ${
                  isActive(item.href)
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="md:hidden px-3 py-2 border-t border-gray-200">
            <div className="space-y-1.5">
              {isHelperMode && currentFamily && (
                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                  <div className="font-semibold mb-0.5">{currentFamily.name}</div>
                  <button
                    onClick={() => {
                      handleBackToFamilies();
                      setMobileMenuOpen(false);
                    }}
                    className="underline hover:text-blue-900"
                  >
                    Wijzigen
                  </button>
                </div>
              )}
              {subscription && !isHelperMode && (
                <div className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                  {subscription.plan}
                </div>
              )}
              <div className="px-3 py-1.5 text-sm text-gray-600">
                Ingelogd als <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>

          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                <Link to="/algemene-voorwaarden" className="hover:text-gray-900">
                  Algemene Voorwaarden
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/privacybeleid" className="hover:text-gray-900">
                  Privacybeleid
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/contact" className="hover:text-gray-900">
                  Contact & Support
                </Link>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                © 2026 Co-Ouderschap. Alle rechten voorbehouden.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
