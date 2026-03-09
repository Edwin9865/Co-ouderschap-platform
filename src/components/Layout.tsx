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
  X,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Request } from '../lib/types';
import { useBackButton } from '../lib/useBackButton';
import { isAndroid } from '../lib/capacitor';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: number;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, familyMemberships } = useAuth();
  const { currentFamily, isParent, isHelper, isHelperMode, subscription, clearHelperFamily } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Swipe-up detection — alleen op de drag-handle balk
  const swipeStartY = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);

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

    const sub = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests', filter: `family_id=eq.${currentFamily.id}` },
        () => fetchOpenRequests()
      )
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [currentFamily, user]);

  const fetchUnreadMessages = useCallback(async () => {
    if (!currentFamily || !user) return;

    const { data } = await supabase
      .from('helper_messages')
      .select('id, recipient_id, sender_id, status, closed, parent_message_id, created_at, has_responded_users')
      .eq('family_id', currentFamily.id)
      .is('parent_message_id', null);

    if (!data) { setUnreadMessagesCount(0); return; }

    const messagesWithReplies = await Promise.all(
      data.map(async (msg: any) => {
        const { data: replies } = await supabase
          .from('helper_messages')
          .select('id, sender_id, recipient_id, status, created_at, has_responded_users')
          .eq('parent_message_id', msg.id)
          .order('created_at', { ascending: true });
        return { ...msg, replies: replies || [] };
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
        if (isHelperMode && isParentGroupMessage) return false;
        if (r.recipient_id === user.id) return true;
        else if (r.recipient_id === null && r.sender_id !== user.id && !isHelperMode) {
          const iHaveReplied = message.replies?.some((reply: any) => reply.sender_id === user.id);
          needsMyResponse = !iHaveReplied;
        }
        return false;
      });
      return needsMyResponse || hasRepliesThatNeedMyResponse;
    }).length;

    setUnreadMessagesCount(actionableCount);
  }, [currentFamily, user, isHelperMode]);

  useEffect(() => { fetchUnreadMessages(); }, [fetchUnreadMessages]);

  useEffect(() => {
    if (!currentFamily) return;
    const sub = supabase
      .channel('helper_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'helper_messages', filter: `family_id=eq.${currentFamily.id}` },
        () => fetchUnreadMessages()
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
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

  const isActive = (href: string) => location.pathname === href;

  // Bottom nav - 5 main items
  const bottomNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-500' },
    { name: 'Kinderen', href: '/kinderen', icon: Users, color: 'text-purple-500' },
    { name: 'Agenda', href: '/agenda', icon: Calendar, color: 'text-emerald-500' },
    { name: 'Logboek', href: '/logboek', icon: BookOpen, color: 'text-amber-500' },
    { name: 'Verzoeken', href: '/verzoeken', icon: MessageSquare, color: 'text-rose-500', badge: openRequestsCount },
  ];

  // Full nav for sidebar (desktop) and bottom sheet (mobile)
  const fullNavItems: NavItem[] = isHelperMode
    ? [
        { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-500' },
        { name: 'Kinderen', href: '/kinderen', icon: Users, color: 'text-purple-500' },
        { name: 'Agenda', href: '/agenda', icon: Calendar, color: 'text-emerald-500' },
        { name: 'Logboek', href: '/logboek', icon: BookOpen, color: 'text-amber-500' },
        { name: 'Verzoeken', href: '/verzoeken', icon: MessageSquare, color: 'text-rose-500' },
        { name: 'Vragen', href: '/vragen', icon: HelpCircle, color: 'text-teal-500', badge: unreadMessagesCount },
        { name: 'Instellingen', href: '/instellingen', icon: Settings, color: 'text-slate-400' },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-500' },
        { name: 'Kinderen', href: '/kinderen', icon: Users, color: 'text-purple-500' },
        { name: 'Agenda', href: '/agenda', icon: Calendar, color: 'text-emerald-500' },
        { name: 'Logboek', href: '/logboek', icon: BookOpen, color: 'text-amber-500' },
        { name: 'Verzoeken', href: '/verzoeken', icon: MessageSquare, color: 'text-rose-500', badge: openRequestsCount },
        { name: 'Hulpverleners', href: '/hulpverleners', icon: HelpCircle, color: 'text-teal-500', badge: unreadMessagesCount },
        { name: 'Export', href: '/export', icon: Download, color: 'text-indigo-500' },
        { name: 'Instellingen', href: '/instellingen', icon: Settings, color: 'text-slate-400' },
      ];

  // Swipe-up op de drag-handle balk boven de bottom nav
  const handleHandleTouchStart = (e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY;
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleHandleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartY.current === null || swipeStartX.current === null) return;
    const deltaY = swipeStartY.current - e.changedTouches[0].clientY;
    const deltaX = Math.abs(e.changedTouches[0].clientX - (swipeStartX.current ?? 0));
    // Omhoog veeg van minimaal 20px, overwegend verticaal → menu openen
    if (deltaY > 20 && deltaX < 60) {
      setMenuSheetOpen(true);
    }
    swipeStartY.current = null;
    swipeStartX.current = null;
  };

  if (!currentFamily && location.pathname !== '/families' && location.pathname !== '/helper-families') {
    return (
      <div className="dashboard-bg min-h-screen bg-cover bg-top bg-fixed flex items-center justify-center">
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
    <div className="dashboard-bg min-h-screen bg-cover bg-top bg-fixed">
      {/* Top nav */}
      <nav
        className="bg-transparent border-b border-white/10"
        style={isAndroid() ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center h-16 md:justify-start">
            {/* Logo — centered on mobile, left on desktop */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img src="/logo.png" alt="CoParenting Logo" className="w-10 h-10 object-contain" />
              <div className="flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-900 leading-tight">CoParenting</div>
                <div className="text-[10px] text-gray-600 font-medium -mt-0.5">-samen opvoeden-</div>
              </div>
            </Link>

            {/* Desktop: user info + logout */}
            <div className="hidden md:flex items-center space-x-1 ml-auto">
              {isHelperMode && currentFamily && (
                <div className="mr-4 flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                  <span className="font-semibold">{currentFamily.name}</span>
                  <button onClick={handleBackToFamilies} className="underline hover:text-blue-900">
                    Wijzigen
                  </button>
                </div>
              )}
              {subscription && !isHelperMode && (
                <div className="mr-4 px-3 py-1 bg-white/40 text-slate-700 text-xs font-medium rounded-full border border-white/50">
                  {subscription.plan}
                </div>
              )}
              <Link to="/account" className="text-sm text-gray-700 hover:text-gray-900 mr-4">
                {user?.name}
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-700 hover:text-gray-900 hover:bg-white/20 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile: plan badge — absolute right */}
            <div className="md:hidden absolute right-0 flex items-center gap-2">
              {subscription && !isHelperMode && (
                <span className="px-2 py-1 bg-white/40 text-slate-700 text-xs font-medium rounded-full border border-white/50">
                  {subscription.plan}
                </span>
              )}
              {isHelperMode && currentFamily && (
                <span className="px-2 py-1 bg-blue-50/70 text-blue-700 text-xs font-medium rounded-lg border border-blue-200/50">
                  {currentFamily.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop sidebar with colored icons */}
        <aside className="hidden md:block w-64 bg-white/10 backdrop-blur-md border-r border-white/20 md:min-h-[calc(100vh-4rem)]">
          <nav className="p-3 space-y-0.5">
            {familyMemberships.length > 1 && !isHelperMode && (
              <Link
                to="/families"
                className="flex items-center space-x-3 px-4 py-2.5 text-gray-800 hover:bg-white/25 rounded-lg"
              >
                <Users className="w-5 h-5 text-blue-400" />
                <span>Gezinnen</span>
              </Link>
            )}
            {fullNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg relative ${
                  isActive(item.href)
                    ? 'bg-white/40 text-slate-900 font-medium'
                    : 'text-gray-800 hover:bg-white/25'
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span>{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="px-3 py-2 border-t border-white/20">
            <div className="space-y-1.5">
              <div className="px-3 py-1.5 text-sm text-gray-600">
                Ingelogd als <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>

          <footer className="mt-12 pt-8 border-t border-white/20">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                <Link to="/algemene-voorwaarden" className="hover:text-gray-900">Algemene Voorwaarden</Link>
                <span className="text-gray-300">|</span>
                <Link to="/privacybeleid" className="hover:text-gray-900">Privacybeleid</Link>
                <span className="text-gray-300">|</span>
                <Link to="/contact" className="hover:text-gray-900">Contact & Support</Link>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                © 2026 CoParenting. Alle rechten voorbehouden.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle — tik of veeg omhoog om het volledige menu te openen */}
        <button
          onClick={() => setMenuSheetOpen(true)}
          onTouchStart={handleHandleTouchStart}
          onTouchEnd={handleHandleTouchEnd}
          className="w-full flex justify-center pt-2 pb-1 touch-none"
          aria-label="Open menu"
        >
          <div className="w-10 h-1.5 bg-white rounded-full shadow-sm" />
        </button>

        <div className="flex">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex-1 flex flex-col items-center py-2 relative"
              >
                <div className="relative">
                  <item.icon
                    className={`w-6 h-6 transition-transform ${active ? 'scale-110' : 'scale-100'} ${active ? item.color : 'text-gray-400'}`}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-medium ${active ? item.color : 'text-gray-400'}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile menu sheet (swipe up) ── */}
      {menuSheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setMenuSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-xl rounded-t-2xl z-50 shadow-2xl border-t border-white/30">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-white/70 rounded-full" />
            </div>

            {/* Close button */}
            <div className="flex justify-end px-4 pb-1">
              <button onClick={() => setMenuSheetOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-4 pb-8 space-y-1" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
              {familyMemberships.length > 1 && !isHelperMode && (
                <Link
                  to="/families"
                  onClick={() => setMenuSheetOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-800 hover:bg-white/30 rounded-xl"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">Gezinnen</span>
                </Link>
              )}

              {fullNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuSheetOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl relative ${
                      active ? 'bg-white/40' : 'hover:bg-white/25'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className={`font-medium ${active ? 'text-slate-900' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="border-t border-white/30 pt-2 mt-2">
                {/* User info */}
                <div className="px-4 py-2 text-sm text-gray-500">
                  Ingelogd als <span className="font-medium text-gray-700">{user?.name}</span>
                </div>

                <button
                  onClick={() => { handleSignOut(); setMenuSheetOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-800 hover:bg-white/25 rounded-xl"
                >
                  <LogOut className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">Uitloggen</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
