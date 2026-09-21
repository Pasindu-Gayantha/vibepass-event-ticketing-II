import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Navbar, { type NavView } from '@/components/Navbar';
import PromoBar from '@/components/PromoBar';
import HomePage from '@/components/HomePage';
import EventDetailModal from '@/components/EventDetailModal';
import CheckoutModal from '@/components/CheckoutModal';
import ConfirmationScreen from '@/components/ConfirmationScreen';
import OrganizerForm from '@/components/OrganizerForm';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLoginModal from '@/components/AdminLoginModal';
import OffersPage from '@/components/OffersPage';
import MyTicketsDrawer from '@/components/MyTicketsDrawer';
import UserAuthModal from '@/components/UserAuthModal';
import EditProfileModal from '@/components/EditProfileModal';
import Footer from '@/components/Footer';
import { fetchEvents, fetchEventWithTiers, createBooking, generateBookingRef, fetchUserTicketsByEmail } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { VibeEvent, TicketTier, User, BookingWithDetails } from '@/types';

type Screen = 'main' | 'confirmation';

interface CheckoutData {
  tier: TicketTier;
  quantity: number;
  promoCode: string;
  subtotal: number;
  discount: number;
  total: number;
}

interface ConfirmationData {
  event: VibeEvent;
  tier: TicketTier;
  quantity: number;
  total: number;
  bookingRef: string;
  customerName: string;
  paymentMethod: string;
}

export default function App() {
  const [view, setView] = useState<NavView>('home');
  const [screen, setScreen] = useState<Screen>('main');
  const [events, setEvents] = useState<VibeEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [initialCategory, setInitialCategory] = useState('');

  // Admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // User auth
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // My Tickets — session and persistent tickets array
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [sessionTickets, setSessionTickets] = useState<BookingWithDetails[]>([]);
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);

  // Event detail modal
  const [selectedEvent, setSelectedEvent] = useState<VibeEvent | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);

  // Checkout modal
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Pending checkout for unauthenticated users
  const [pendingCheckout, setPendingCheckout] = useState<{
    event: VibeEvent;
    data: CheckoutData;
  } | null>(null);

  // Confirmation
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const ticketCount = sessionTickets.length;

  useEffect(() => {
    loadEvents();

    // Check localStorage for persistent user session
    const cachedUser = localStorage.getItem('vibepass_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        loadUserTickets(parsed.email);
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    }
  }, []);

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadUserTickets = async (email: string) => {
    if (!email) return;
    try {
      const tickets = await fetchUserTicketsByEmail(email);
      setSessionTickets(tickets);
    } catch (err) {
      console.error('Failed to load tickets on session init:', err);
    }
  };

  const handleNavigate = (v: NavView) => {
    setView(v);
    setScreen('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (category: string) => {
    setInitialCategory(category);
  };

  const handleAdminAccess = () => {
    if (isAdmin) {
      setView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    setView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogOut = () => {
    setIsAdmin(false);
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (u: User) => {
    setUser(u);
    localStorage.setItem('vibepass_user', JSON.stringify(u));
    setShowAuth(false);
    await loadUserTickets(u.email);

    if (pendingCheckout) {
      setSelectedEvent(pendingCheckout.event);
      setCheckoutData(pendingCheckout.data);
      setPendingCheckout(null);
    }
  };

  const handleUserLogOut = () => {
    setUser(null);
    localStorage.removeItem('vibepass_user');
    setSessionTickets([]);
    setPendingCheckout(null);
    if (view === 'admin' && !isAdmin) {
      setView('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileSave = (updated: User) => {
    setUser(updated);
    localStorage.setItem('vibepass_user', JSON.stringify(updated));
  };

  const handleMyTickets = () => {
    setTicketsRefreshKey((k) => k + 1);
    setShowMyTickets(true);
  };

  const handleEventClick = async (event: VibeEvent) => {
    setSelectedEvent(event);
    setTiers([]);
    setTiersLoading(true);
    try {
      const { tiers: t } = await fetchEventWithTiers(event.id);
      setTiers(t);
    } catch (e) {
      console.error('Failed to load tiers', e);
    } finally {
      setTiersLoading(false);
    }
  };

  const handleBook = (tier: TicketTier, quantity: number, promoCode: string, subtotal: number, discount: number, total: number) => {
    if (!user) {
      if (selectedEvent) {
        setPendingCheckout({
          event: selectedEvent,
          data: { tier, quantity, promoCode, subtotal, discount, total },
        });
      }
      setSelectedEvent(null);
      setShowAuth(true);
      setToast('Please log in first to make a booking!');
      setTimeout(() => setToast(null), 3500);
      return;
    }

    setCheckoutData({ tier, quantity, promoCode, subtotal, discount, total });
  };

  const handleCheckoutConfirm = async (details: { name: string; email: string; mobile: string; paymentMethod: 'card' | 'lankaqr' }) => {
    if (!selectedEvent || !checkoutData) return;

    const bookingRef = generateBookingRef();

    await createBooking({
      event_id: selectedEvent.id,
      tier_id: checkoutData.tier.id,
      customer_name: details.name,
      email: details.email,
      mobile: details.mobile,
      payment_method: details.paymentMethod,
      quantity: checkoutData.quantity,
      subtotal: checkoutData.subtotal,
      discount: checkoutData.discount,
      total_amount: checkoutData.total,
      promo_code: checkoutData.promoCode || null,
      booking_ref: bookingRef,
    });

    setConfirmationData({
      event: selectedEvent,
      tier: checkoutData.tier,
      quantity: checkoutData.quantity,
      total: checkoutData.total,
      bookingRef,
      customerName: details.name,
      paymentMethod: details.paymentMethod,
    });

    if (user) {
      const newTicket: BookingWithDetails = {
        id: `session-${Date.now()}`,
        event_id: selectedEvent.id,
        tier_id: checkoutData.tier.id,
        customer_name: details.name,
        email: details.email,
        mobile: details.mobile,
        payment_method: details.paymentMethod,
        quantity: checkoutData.quantity,
        subtotal: checkoutData.subtotal,
        discount: checkoutData.discount,
        total_amount: checkoutData.total,
        promo_code: checkoutData.promoCode || null,
        booking_ref: bookingRef,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        event: {
          title: selectedEvent.title,
          venue: selectedEvent.venue,
          event_date: selectedEvent.event_date,
          banner_url: selectedEvent.banner_url,
        },
        tier: { name: checkoutData.tier.name, price: checkoutData.tier.price },
      };
      setSessionTickets((prev) => [newTicket, ...prev]);
    }

    setCheckoutData(null);
    setSelectedEvent(null);
    setScreen('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Live Supabase Sync for Admin Create Event (Member 3)
  const handleCreateEvent = async (event: VibeEvent) => {
    try {
      const newEventId = crypto.randomUUID();
      const defaultCategoryId = '29d33cb9-86e8-43c5-9250-242b91a5f380';

      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            id: newEventId,
            title: event.title,
            description: event.description || '',
            venue: event.venue,
            event_date: event.event_date,
            banner_url: event.banner_url,
            category_id: (event as any).category_id || defaultCategoryId,
            status: 'published',
          },
        ])
        .select();

      if (error) {
        console.warn('Supabase insert note:', error.message);
      } else {
        console.log('Event successfully saved to Supabase by [M3]:', data);

        await supabase.from('ticket_tiers').insert([
          {
            id: crypto.randomUUID(),
            event_id: newEventId,
            tier_name: 'General Pass',
            price: event.starting_price || 3500,
            total_quantity: 500,
            available_quantity: 500,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to insert into Supabase:', err);
    }

    setEvents((prev) => [event, ...prev]);
    setToast('Event published successfully to Supabase!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleBackToEvents = () => {
    setScreen('main');
    setConfirmationData(null);
    setView('home');
    loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar
        view={view}
        isAdmin={isAdmin}
        user={user}
        ticketCount={ticketCount}
        onNavigate={handleNavigate}
        onCategorySelect={handleCategorySelect}
        onMyTickets={handleMyTickets}
        onAdminAccess={handleAdminAccess}
        onShowAuth={() => setShowAuth(true)}
        onLogOut={handleUserLogOut}
        onEditProfile={() => setShowEditProfile(true)}
      />

      {view === 'home' && screen === 'main' && (
        <>
          <PromoBar />
          {eventsLoading ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <HomePage
              events={events}
              onEventClick={handleEventClick}
              initialCategory={initialCategory}
            />
          )}
        </>
      )}

      {view === 'home' && screen === 'confirmation' && confirmationData && (
        <ConfirmationScreen
          event={confirmationData.event}
          tier={confirmationData.tier}
          quantity={confirmationData.quantity}
          total={confirmationData.total}
          bookingRef={confirmationData.bookingRef}
          customerName={confirmationData.customerName}
          paymentMethod={confirmationData.paymentMethod}
          onBackToEvents={handleBackToEvents}
        />
      )}

      {view === 'organizer' && <OrganizerForm />}
      {view === 'admin' && isAdmin && <AdminDashboard onLogOut={handleAdminLogOut} onCreateEvent={handleCreateEvent} />}
      {view === 'admin' && !isAdmin && (
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg">Access denied. Please log in.</p>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              Admin Login
            </button>
          </div>
        </div>
      )}
      {view === 'offers' && <OffersPage />}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          tiers={tiers}
          loading={tiersLoading}
          onClose={() => setSelectedEvent(null)}
          onBook={handleBook}
        />
      )}

      {/* Checkout Modal with initialUser passed */}
      {selectedEvent && checkoutData && (
        <CheckoutModal
          event={selectedEvent}
          tier={checkoutData.tier}
          quantity={checkoutData.quantity}
          subtotal={checkoutData.subtotal}
          discount={checkoutData.discount}
          total={checkoutData.total}
          promoCode={checkoutData.promoCode}
          initialUser={user || undefined}
          onClose={() => {
            setCheckoutData(null);
            setPendingCheckout(null);
          }}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

      {/* User Auth Modal */}
      {showAuth && (
        <UserAuthModal
          onClose={() => {
            setShowAuth(false);
            setPendingCheckout(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={handleProfileSave}
        />
      )}

      {/* My Tickets Drawer */}
      {showMyTickets && (
        <MyTicketsDrawer
          onClose={() => setShowMyTickets(false)}
          refreshKey={ticketsRefreshKey}
          sessionTickets={sessionTickets}
          userEmail={user?.email}
        />
      )}

      {/* Footer */}
      {view !== 'admin' && (
        <Footer onNavigate={handleNavigate} onCategorySelect={handleCategorySelect} />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 animate-[fadeInUp_0.3s_ease-out]">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}