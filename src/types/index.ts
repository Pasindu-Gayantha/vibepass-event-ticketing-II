export type EventCategory = 'Concert' | 'EDM' | 'Acoustic' | 'Classical & Acoustic' | 'Rock';
export type EventStatus = 'active' | 'published' | 'sold_out' | 'cancelled';
export type BookingStatus = 'confirmed' | 'redeemed' | 'cancelled' | 'paid' | 'pending';
export type PaymentMethod = 'card' | 'lankaqr';
export type InquiryStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface VibeEvent {
  id: string;
  title: string;
  category: string;
  category_id?: string;
  venue: string;
  location?: string;
  event_date: string;
  banner_url: string;
  lineup?: string[];
  description: string;
  tickets_remaining?: number;
  starting_price: number;
  status: EventStatus;
  is_featured?: boolean;
  created_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  tier_name?: string;
  price: number;
  available: number;
  available_quantity?: number;
  total_quantity?: number;
  perks?: string[];
}

export interface Booking {
  id: string;
  event_id: string;
  tier_id: string;
  customer_name: string;
  email: string;
  mobile: string;
  payment_method: PaymentMethod;
  quantity: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  promo_code: string | null;
  booking_ref: string;
  status: BookingStatus;
  created_at: string;
}

export interface OrganizerInquiry {
  id: string;
  organizer_name: string;
  email: string;
  phone: string;
  event_concept: string;
  expected_attendees: number;
  notes: string | null;
  status: InquiryStatus;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  event?: Pick<VibeEvent, 'title' | 'venue' | 'event_date' | 'banner_url'>;
  tier?: Pick<TicketTier, 'name' | 'price'>;
}

export interface User {
  name: string;
  email: string;
  phone: string;
}