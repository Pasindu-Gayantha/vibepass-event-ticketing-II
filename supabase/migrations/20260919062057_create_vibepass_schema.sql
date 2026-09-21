/*
# VibePass — Musical & Concert Event Ticketing Schema

## Overview
Creates the complete database schema for VibePass, a concert ticketing platform
for Sri Lankan music events. This is a single-tenant (no-auth) app where the
frontend reads and writes as the anon role.

## New Tables

1. `events`
   - `id` (uuid, PK)
   - `title` (text) — event name
   - `category` (text) — 'Concert' | 'EDM' | 'Acoustic'
   - `venue` (text) — venue name
   - `location` (text) — city/area
   - `event_date` (timestamptz) — when the event happens
   - `banner_url` (text) — hero image URL
   - `lineup` (text[]) — list of performing artists
   - `description` (text) — event description
   - `tickets_remaining` (int) — total tickets left across all tiers
   - `starting_price` (numeric) — lowest tier price in LKR
   - `status` (text) — 'active' | 'sold_out' | 'cancelled'
   - `created_at` (timestamptz)

2. `ticket_tiers`
   - `id` (uuid, PK)
   - `event_id` (uuid, FK → events)
   - `name` (text) — 'General' | 'VIP' | 'Backstage'
   - `price` (numeric) — price per ticket in LKR
   - `available` (int) — tickets remaining in this tier
   - `perks` (text[]) — list of tier benefits

3. `bookings`
   - `id` (uuid, PK)
   - `event_id` (uuid, FK → events)
   - `tier_id` (uuid, FK → ticket_tiers)
   - `customer_name` (text)
   - `email` (text)
   - `mobile` (text)
   - `payment_method` (text) — 'card' | 'lankaqr'
   - `quantity` (int)
   - `subtotal` (numeric)
   - `discount` (numeric)
   - `total_amount` (numeric)
   - `promo_code` (text, nullable)
   - `booking_ref` (text, unique) — human-readable booking ID
   - `status` (text) — 'confirmed' | 'redeemed' | 'cancelled'
   - `created_at` (timestamptz)

4. `organizer_inquiries`
   - `id` (uuid, PK)
   - `organizer_name` (text)
   - `email` (text)
   - `phone` (text)
   - `event_concept` (text)
   - `expected_attendees` (int)
   - `notes` (text, nullable)
   - `status` (text) — 'pending' | 'reviewing' | 'approved' | 'rejected'
   - `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant public ticketing app with no sign-in screen.
- Data is intentionally shared/public.

## Seed Data
- 6 Sri Lankan music events across Concerts, EDM, and Acoustic categories.
- 3 ticket tiers per event (General, VIP, Backstage) with varying prices.
- 4 sample bookings for the admin dashboard.
- 3 organizer inquiries for the admin dashboard.
*/

-- ==================== EVENTS ====================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Concert', 'EDM', 'Acoustic')),
  venue text NOT NULL,
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  banner_url text NOT NULL,
  lineup text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  tickets_remaining int NOT NULL DEFAULT 0,
  starting_price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== TICKET TIERS ====================
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  available int NOT NULL DEFAULT 100,
  perks text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tiers" ON ticket_tiers;
CREATE POLICY "anon_select_tiers" ON ticket_tiers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tiers" ON ticket_tiers;
CREATE POLICY "anon_insert_tiers" ON ticket_tiers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tiers" ON ticket_tiers;
CREATE POLICY "anon_update_tiers" ON ticket_tiers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tiers" ON ticket_tiers;
CREATE POLICY "anon_delete_tiers" ON ticket_tiers FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== BOOKINGS ====================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'lankaqr')),
  quantity int NOT NULL DEFAULT 1,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  promo_code text,
  booking_ref text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'redeemed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== ORGANIZER INQUIRIES ====================
CREATE TABLE IF NOT EXISTS organizer_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  event_concept text NOT NULL,
  expected_attendees int NOT NULL DEFAULT 100,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_inquiries" ON organizer_inquiries;
CREATE POLICY "anon_select_inquiries" ON organizer_inquiries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inquiries" ON organizer_inquiries;
CREATE POLICY "anon_insert_inquiries" ON organizer_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inquiries" ON organizer_inquiries;
CREATE POLICY "anon_update_inquiries" ON organizer_inquiries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inquiries" ON organizer_inquiries;
CREATE POLICY "anon_delete_inquiries" ON organizer_inquiries FOR DELETE
  TO anon, authenticated USING (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event ON ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON organizer_inquiries(status);

-- ==================== SEED DATA ====================
-- Events with Sri Lankan venues and upcoming dates

INSERT INTO events (id, title, category, venue, location, event_date, banner_url, lineup, description, tickets_remaining, starting_price, status)
VALUES
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Rhythm of Lanka Live',
  'Concert',
  'Colombo Indoor Stadium',
  'Colombo',
  '2026-10-15 19:00:00+05:30',
  'https://images.pexels.com/photos/167605/pexels-photo-167605.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['Bathiya & Santhush', 'Chithral Somapala', 'Umaria Sinhawansa'],
  'Sri Lanka''s biggest live concert returns to Colombo Indoor Stadium with a full band, orchestral backing, and chart-topping hits from the island''s most beloved artists.',
  8, 2500, 'active'
),
(
  'a1b2c3d4-0001-4000-8000-000000000002',
  'Neon Beach Rave',
  'EDM',
  'Mount Lavinia Beach',
  'Mount Lavinia',
  '2026-10-28 18:00:00+05:30',
  'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['DJ Dinesh', 'Maya Beats', 'Ravi Nectar'],
  'Dance barefoot on the sand under laser lights. Mount Lavinia Beach transforms into an open-air EDM paradise with international-grade sound and pyrotechnics.',
  3, 3500, 'active'
),
(
  'a1b2c3d4-0001-4000-8000-000000000003',
  'Viharamahadevi Acoustic Night',
  'Acoustic',
  'Viharamahadevi Open Air Theatre',
  'Colombo',
  '2026-11-05 18:30:00+05:30',
  'https://images.pexels.com/photos/7715347/pexels-photo-7715347.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['Nanda Malini Tribute', 'Kasun Kalhara', 'Randhir Witana'],
  'An intimate evening of unplugged melodies under the stars at the Viharamahadevi Open Air Theatre. Soulful vocals, acoustic guitars, and storytelling.',
  25, 1800, 'active'
),
(
  'a1b2c3d4-0001-4000-8000-000000000004',
  'Baila Bonanza Festival',
  'Concert',
  'Sugathadasa Stadium',
  'Colombo',
  '2026-11-20 17:00:00+05:30',
  'https://images.pexels.com/photos/5193526/pexels-photo-5193526.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['Sunil Edirisinghe', 'Amitha Weerasinghe', 'The Ceylonmers'],
  'A celebration of Sri Lankan baila and pop classics. Sing along to timeless hits with a full brass section and a crowd of thousands.',
  50, 2200, 'active'
),
(
  'a1b2c3d4-0001-4000-8000-000000000005',
  'Midnight Bass Festival',
  'EDM',
  'Galle Face Green',
  'Colombo',
  '2026-12-01 19:00:00+05:30',
  'https://images.pexels.com/photos/1677710/pexels-photo-1677710.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['DJ Asela', 'Thilina Perera', 'Bass Collective'],
  'The capital''s largest outdoor EDM festival. Three stages, 12 DJs, and a midnight countdown you will never forget.',
  15, 4000, 'active'
),
(
  'a1b2c3d4-0001-4000-8000-000000000006',
  'Strings & Voices Unplugged',
  'Acoustic',
  'Nelum Pokuna Theatre',
  'Colombo',
  '2026-12-10 19:00:00+05:30',
  'https://images.pexels.com/photos/3947517/pexels-photo-3947517.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ARRAY['Shiromi Fernando', 'Dhyan Hewage', 'Indrachapa Liyanage'],
  'A candlelit acoustic showcase featuring Sri Lanka''s finest singer-songwriters sharing stories and songs in an intimate theatre setting.',
  40, 2000, 'active'
)
ON CONFLICT (id) DO NOTHING;

-- Ticket tiers for each event
INSERT INTO ticket_tiers (event_id, name, price, available, perks)
SELECT e.id, 'General', 2500, 120, ARRAY['Standing area access', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000001'
UNION ALL SELECT e.id, 'VIP', 5500, 40, ARRAY['Reserved seating', 'Welcome drink', 'Premium view'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000001'
UNION ALL SELECT e.id, 'Backstage', 12000, 8, ARRAY['Backstage access', 'Meet & greet', 'Complimentary dinner', 'VIP laminate'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000001'

UNION ALL SELECT e.id, 'General', 3500, 200, ARRAY['Beach access', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000002'
UNION ALL SELECT e.id, 'VIP', 6500, 30, ARRAY['Front stage zone', 'LED wristband', 'Express bar'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000002'
UNION ALL SELECT e.id, 'Backstage', 15000, 3, ARRAY['DJ booth access', 'Artist meet & greet', 'Champagne table', 'Festival merch kit'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000002'

UNION ALL SELECT e.id, 'General', 1800, 150, ARRAY['Open seating', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000003'
UNION ALL SELECT e.id, 'VIP', 3500, 25, ARRAY['Reserved cushion seating', 'Tea & snacks included'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000003'
UNION ALL SELECT e.id, 'Backstage', 7000, 10, ARRAY['Artist meet & greet', 'Signed poster', 'Sound check access'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000003'

UNION ALL SELECT e.id, 'General', 2200, 300, ARRAY['Stadium seating', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000004'
UNION ALL SELECT e.id, 'VIP', 4800, 50, ARRAY['Premium seating', 'Food voucher', 'Early entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000004'
UNION ALL SELECT e.id, 'Backstage', 10000, 12, ARRAY['Backstage tour', 'Artist photo op', 'Festival t-shirt'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000004'

UNION ALL SELECT e.id, 'General', 4000, 250, ARRAY['Field access', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000005'
UNION ALL SELECT e.id, 'VIP', 7500, 15, ARRAY['Front barrier zone', 'Glow pack', 'Express entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000005'
UNION ALL SELECT e.id, 'Backstage', 18000, 5, ARRAY['Stage-side deck', 'Artist access', 'Premium bar', 'Merch bundle'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000005'

UNION ALL SELECT e.id, 'General', 2000, 120, ARRAY['Theatre seating', 'Standard entry'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000006'
UNION ALL SELECT e.id, 'VIP', 4200, 40, ARRAY['Premium seating', 'Programme booklet', 'Interval refreshment'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000006'
UNION ALL SELECT e.id, 'Backstage', 8500, 8, ARRAY['Artist meet & greet', 'Signed CD', 'Post-show reception'] FROM events e WHERE e.id = 'a1b2c3d4-0001-4000-8000-000000000006'
ON CONFLICT DO NOTHING;

-- Sample bookings for admin dashboard
INSERT INTO bookings (id, event_id, tier_id, customer_name, email, mobile, payment_method, quantity, subtotal, discount, total_amount, promo_code, booking_ref, status, created_at)
VALUES
(
  'b0000000-0000-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-8000-000000000001',
  (SELECT id FROM ticket_tiers WHERE event_id = 'a1b2c3d4-0001-4000-8000-000000000001' AND name = 'VIP'),
  'Kasun Perera', 'kasun.p@gmail.com', '0771234567', 'card', 2, 11000, 1100, 9900, 'VIBE10', 'VP-2026-001234', 'confirmed', '2026-09-15 14:30:00+05:30'
),
(
  'b0000000-0000-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-8000-000000000002',
  (SELECT id FROM ticket_tiers WHERE event_id = 'a1b2c3d4-0001-4000-8000-000000000002' AND name = 'General'),
  'Nimasha Silva', 'nimasha.s@yahoo.com', '0769876543', 'lankaqr', 3, 10500, 0, 10500, NULL, 'VP-2026-001235', 'confirmed', '2026-09-16 10:15:00+05:30'
),
(
  'b0000000-0000-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-8000-000000000003',
  (SELECT id FROM ticket_tiers WHERE event_id = 'a1b2c3d4-0001-4000-8000-000000000003' AND name = 'Backstage'),
  'Tharindu Jayasuriya', 'tharindu.j@outlook.com', '0715556677', 'card', 1, 7000, 700, 6300, 'VIBE10', 'VP-2026-001236', 'redeemed', '2026-09-17 16:45:00+05:30'
),
(
  'b0000000-0000-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-8000-000000000004',
  (SELECT id FROM ticket_tiers WHERE event_id = 'a1b2c3d4-0001-4000-8000-000000000004' AND name = 'General'),
  'Dilani Wickrama', 'dilani.w@gmail.com', '0753344112', 'lankaqr', 4, 8800, 880, 7920, 'VIBE10', 'VP-2026-001237', 'confirmed', '2026-09-18 09:20:00+05:30'
)
ON CONFLICT (id) DO NOTHING;

-- Sample organizer inquiries
INSERT INTO organizer_inquiries (id, organizer_name, email, phone, event_concept, expected_attendees, notes, status, created_at)
VALUES
(
  'c0000000-0000-4000-8000-000000000001',
  'Ranga Events Ltd', 'ranga@events.lk', '0771002000', 'Outdoor jazz festival at Independence Square with 5 local bands', 800, 'Need stage, sound, and lighting setup. Prefer weekend slot in December.', 'pending', '2026-09-14 11:00:00+05:30'
),
(
  'c0000000-0000-4000-8000-000000000002',
  'Colombo Music Collective', 'info@colombomusic.lk', '0762003000', 'Indie rock showcase at BMICH with 8 emerging bands over two days', 1200, 'Looking for ticketing platform integration and marketing support.', 'reviewing', '2026-09-16 13:30:00+05:30'
),
(
  'c0000000-0000-4000-8000-000000000003',
  'Galle Arts Foundation', 'events@gallearts.org', '0713004000', 'Beachside classical music evening at Unawatuna with symphony orchestra', 500, 'High-end event, need VIP and backstage tier options. December 2026.', 'pending', '2026-09-18 15:00:00+05:30'
)
ON CONFLICT (id) DO NOTHING;
