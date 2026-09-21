import { supabase } from '@/lib/supabase';
import type { VibeEvent, TicketTier, Booking, OrganizerInquiry, BookingWithDetails } from '@/types';

// Fetch events along with their associated categories and ticket tiers
export async function fetchEvents(): Promise<VibeEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, categories(name, slug), ticket_tiers(price)')
    .in('status', ['published', 'active'])
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return ((data ?? []) as any[]).map((e) => {
    let minPrice = Number(e.starting_price || e.price || 0);

    if ((!minPrice || isNaN(minPrice)) && Array.isArray(e.ticket_tiers) && e.ticket_tiers.length > 0) {
      const prices = e.ticket_tiers
        .map((t: any) => Number(t.price))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
      }
    }

    const catName = e.categories?.name || 'Concert';

    return {
      ...e,
      category: catName,
      starting_price: minPrice > 0 ? minPrice : 2500,
      lineup: Array.isArray(e.lineup) ? e.lineup : [],
      location: e.location || e.venue || 'Colombo',
    };
  }) as VibeEvent[];
}

export async function fetchEventTiers(eventId: string): Promise<TicketTier[]> {
  const { data, error } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('event_id', eventId)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching tiers:', error);
    throw error;
  }

  return ((data ?? []) as any[]).map((t) => ({
    ...t,
    name: t.tier_name || t.name || 'General Admission',
    available: t.available_quantity ?? t.available ?? 0,
    price: Number(t.price) || 0,
    perks: t.perks || [],
  }));
}

export async function fetchEventWithTiers(eventId: string): Promise<{ event: VibeEvent | null; tiers: TicketTier[] }> {
  const [eventRes, tiers] = await Promise.all([
    supabase.from('events').select('*, categories(name)').eq('id', eventId).maybeSingle(),
    fetchEventTiers(eventId),
  ]);

  if (eventRes.error) {
    console.error('Error fetching event with tiers:', eventRes.error);
    throw eventRes.error;
  }

  const e = eventRes.data as any;
  const eventObj: VibeEvent | null = e
    ? {
        ...e,
        category: e.categories?.name || 'Concert',
        starting_price: Number(e.starting_price) || 2500,
        lineup: Array.isArray(e.lineup) ? e.lineup : [],
        location: e.location || e.venue || 'Colombo',
      }
    : null;

  return {
    event: eventObj,
    tiers,
  };
}

// Create booking with 'completed' status, generate issued tickets, and decrement available ticket tier quantity
export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'status'> & { status?: string }
): Promise<Booking> {
  const bookingRef = booking.booking_ref || generateBookingRef();
  const orderId = crypto.randomUUID();

  // 1. Insert order record into the orders table with 'completed' status
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      customer_name: booking.customer_name,
      customer_email: booking.email,
      customer_phone: booking.mobile,
      total_amount: booking.total_amount,
      payment_status: 'completed',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Orders table insert error:', orderError);
  }

  // 2. Insert individual tickets into issued_tickets table
  if (booking.tier_id) {
    const ticketsToInsert = Array.from({ length: booking.quantity }).map((_, index) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      tier_id: booking.tier_id,
      ticket_hash: `${bookingRef}-${index + 1}`,
      is_checked_in: false,
    }));

    const { error: ticketError } = await supabase.from('issued_tickets').insert(ticketsToInsert);
    if (ticketError) {
      console.error('issued_tickets insert error:', ticketError);
    }

    // 3. Decrement available quantity in the ticket_tiers table
    try {
      const { data: tierData } = await supabase
        .from('ticket_tiers')
        .select('available_quantity')
        .eq('id', booking.tier_id)
        .maybeSingle();

      if (tierData && typeof tierData.available_quantity === 'number') {
        const newQty = Math.max(0, tierData.available_quantity - booking.quantity);
        await supabase
          .from('ticket_tiers')
          .update({ available_quantity: newQty })
          .eq('id', booking.tier_id);
      }
    } catch (e) {
      console.warn('Inventory decrement issue:', e);
    }
  }

  return {
    id: orderId,
    event_id: booking.event_id,
    tier_id: booking.tier_id,
    customer_name: booking.customer_name,
    email: booking.email,
    mobile: booking.mobile,
    payment_method: booking.payment_method,
    quantity: booking.quantity,
    subtotal: booking.subtotal,
    discount: booking.discount,
    total_amount: booking.total_amount,
    promo_code: booking.promo_code,
    booking_ref: bookingRef,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  };
}

// Fetch user tickets directly from Supabase by email for persistent session state
export async function fetchUserTicketsByEmail(email: string): Promise<BookingWithDetails[]> {
  if (!email) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      total_amount,
      created_at,
      payment_status,
      issued_tickets (
        id,
        ticket_hash,
        is_checked_in,
        tier:ticket_tiers (
          tier_name,
          price,
          event:events (
            title,
            venue,
            event_date,
            banner_url
          )
        )
      )
    `)
    .ilike('customer_email', email)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching user tickets:', error);
    return [];
  }

  const result: BookingWithDetails[] = [];
  for (const order of data as any[]) {
    const tickets = order.issued_tickets || [];
    const firstTicket = tickets[0];
    const event = firstTicket?.tier?.event;
    const tier = firstTicket?.tier;
    const ref = firstTicket?.ticket_hash ? firstTicket.ticket_hash.replace(/-\d+$/, '') : `ORD-${order.id.slice(0, 8).toUpperCase()}`;

    result.push({
      id: order.id,
      event_id: '',
      tier_id: '',
      customer_name: order.customer_name || '',
      email: order.customer_email || '',
      mobile: order.customer_phone || '',
      payment_method: 'card',
      quantity: tickets.length || 1,
      subtotal: Number(tier?.price || 0) * (tickets.length || 1),
      discount: 0,
      total_amount: Number(order.total_amount) || 0,
      promo_code: null,
      booking_ref: ref,
      status: order.payment_status === 'completed' ? 'confirmed' : 'cancelled',
      created_at: order.created_at,
      event: event || null,
      tier: tier ? { name: tier.tier_name, price: tier.price } : undefined,
    });
  }

  return result;
}

export async function fetchBookingByRef(ref: string): Promise<BookingWithDetails | null> {
  const cleanRef = ref.trim();
  if (!cleanRef) return null;

  const { data, error } = await supabase
    .from('issued_tickets')
    .select(`
      id,
      ticket_hash,
      is_checked_in,
      order:orders(customer_name, customer_email, customer_phone, total_amount, created_at),
      tier:ticket_tiers(tier_name, price, event:events(title, venue, event_date, banner_url))
    `)
    .or(`ticket_hash.eq.${cleanRef},ticket_hash.ilike.${cleanRef}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const item = data as any;
  return {
    id: item.id,
    event_id: '',
    tier_id: '',
    customer_name: item.order?.customer_name || '',
    email: item.order?.customer_email || '',
    mobile: item.order?.customer_phone || '',
    payment_method: 'card',
    quantity: 1,
    subtotal: Number(item.tier?.price) || 0,
    discount: 0,
    total_amount: Number(item.order?.total_amount) || 0,
    promo_code: null,
    booking_ref: cleanRef,
    status: item.is_checked_in ? 'redeemed' : 'confirmed',
    created_at: item.order?.created_at || new Date().toISOString(),
    event: item.tier?.event,
    tier: {
      name: item.tier?.tier_name,
      price: item.tier?.price,
    },
  };
}

// Fetch all bookings along with linked event and ticket tier info for Admin Dashboard
export async function fetchAllBookings(): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      total_amount,
      payment_status,
      created_at,
      issued_tickets (
        id,
        ticket_hash,
        tier:ticket_tiers (
          tier_name,
          event:events (
            title
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((o) => {
    const firstTicket = o.issued_tickets?.[0];
    const eventTitle = firstTicket?.tier?.event?.title || '-';
    const tierName = firstTicket?.tier?.tier_name || '-';

    return {
      id: o.id,
      event_id: '',
      tier_id: '',
      customer_name: o.customer_name || 'Anonymous',
      email: o.customer_email || '',
      mobile: o.customer_phone || '',
      payment_method: 'card',
      quantity: o.issued_tickets?.length || 1,
      subtotal: Number(o.total_amount) || 0,
      discount: 0,
      total_amount: Number(o.total_amount) || 0,
      promo_code: null,
      booking_ref: firstTicket?.ticket_hash ? firstTicket.ticket_hash.replace(/-\d+$/, '') : `ORD-${o.id.slice(0, 8).toUpperCase()}`,
      status: o.payment_status === 'completed' ? 'confirmed' : 'cancelled',
      created_at: o.created_at,
      event: { title: eventTitle } as any,
      tier: { name: tierName } as any,
    };
  });
}

export async function fetchRecentBookings(limit = 10): Promise<BookingWithDetails[]> {
  const bookings = await fetchAllBookings();
  return bookings.slice(0, limit);
}

// Fetch inquiries for admin dashboard
export async function fetchInquiries(): Promise<OrganizerInquiry[]> {
  const { data, error } = await supabase
    .from('organizer_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }

  return ((data ?? []) as any[]).map((i) => ({
    id: i.id,
    organizer_name: i.organizer_name || '',
    email: i.contact_email || i.email || '',
    phone: i.contact_phone || i.phone || '',
    event_concept: i.event_title || i.event_concept || '',
    expected_attendees: Number(i.expected_attendees) || 0,
    notes: i.message || i.notes || '',
    status: i.status || 'pending',
    created_at: i.created_at,
  }));
}

// Fetch organizer's submitted proposals by email
export async function fetchProposalsByEmail(email: string): Promise<OrganizerInquiry[]> {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from('organizer_inquiries')
    .select('*')
    .ilike('contact_email', cleanEmail)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proposals by email:', error);
    return [];
  }

  return ((data ?? []) as any[]).map((i) => ({
    id: i.id,
    organizer_name: i.organizer_name || '',
    email: i.contact_email || '',
    phone: i.contact_phone || '',
    event_concept: i.event_title || '',
    expected_attendees: Number(i.expected_attendees) || 0,
    notes: i.message || '',
    status: i.status || 'pending',
    created_at: i.created_at,
  }));
}

// Create new organizer proposal inquiry
export async function createInquiry(
  inquiry: Omit<OrganizerInquiry, 'id' | 'created_at' | 'status'>
): Promise<OrganizerInquiry> {
  const generatedId = crypto.randomUUID();
  const now = new Date().toISOString();

  const rowData = {
    id: generatedId,
    organizer_name: inquiry.organizer_name.trim(),
    contact_email: inquiry.email.trim().toLowerCase(),
    contact_phone: inquiry.phone.trim(),
    event_title: inquiry.event_concept.trim(),
    expected_attendees: parseInt(String(inquiry.expected_attendees), 10) || 100,
    message: inquiry.notes ? inquiry.notes.trim() : null,
    status: 'pending',
  };

  const { error } = await supabase
    .from('organizer_inquiries')
    .insert([rowData]);

  if (error) {
    console.error('Supabase createInquiry error:', error);
    throw error;
  }

  return {
    id: generatedId,
    organizer_name: rowData.organizer_name,
    email: rowData.contact_email,
    phone: rowData.contact_phone,
    event_concept: rowData.event_title,
    expected_attendees: rowData.expected_attendees,
    notes: rowData.message,
    status: 'pending',
    created_at: now,
  };
}

export async function updateInquiryStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('organizer_inquiries')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchAdminStats(): Promise<{
  totalRevenue: number;
  ticketsSold: number;
  activeConcerts: number;
  pendingInquiries: number;
}> {
  const [ordersRes, eventsRes, inquiriesRes, ticketsRes] = await Promise.all([
    supabase.from('orders').select('total_amount, payment_status'),
    supabase.from('events').select('id, status').in('status', ['published', 'active']),
    supabase.from('organizer_inquiries').select('id, status').eq('status', 'pending'),
    supabase.from('issued_tickets').select('id', { count: 'exact' }),
  ]);

  const paidOrders = (ordersRes.data ?? []).filter((o) => o.payment_status === 'completed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return {
    totalRevenue,
    ticketsSold: ticketsRes.count ?? paidOrders.length,
    activeConcerts: eventsRes.data?.length ?? 0,
    pendingInquiries: inquiriesRes.data?.length ?? 0,
  };
}

// Validates ticket by matching exact ticket_hash or base booking_ref prefix
export async function validateTicket(ref: string): Promise<{ found: boolean; status: string | null }> {
  const cleanRef = ref.trim();
  if (!cleanRef) return { found: false, status: null };

  const { data, error } = await supabase
    .from('issued_tickets')
    .select('is_checked_in')
    .or(`ticket_hash.eq.${cleanRef},ticket_hash.ilike.${cleanRef}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return { found: false, status: null };
  return { found: true, status: data.is_checked_in ? 'redeemed' : 'confirmed' };
}

// Redeems ticket by marking issued ticket record(s) checked-in
export async function redeemTicket(ref: string): Promise<void> {
  const cleanRef = ref.trim();
  if (!cleanRef) return;

  const { error } = await supabase
    .from('issued_tickets')
    .update({ is_checked_in: true })
    .or(`ticket_hash.eq.${cleanRef},ticket_hash.ilike.${cleanRef}%`);

  if (error) throw error;
}

export function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `VP-${year}-${random}`;
}