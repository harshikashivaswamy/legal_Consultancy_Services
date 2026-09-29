-- =============================================================================
-- Legal Consultancy Service — Supabase (PostgreSQL) schema
--
--  * SAFE TO RE-RUN: it never drops tables or deletes data. Use it for a fresh
--    project AND to upgrade a project that already ran the previous schema.
--  * Row Level Security (RLS) is enabled on every table with least-privilege policies.
--  * Roles are server-controlled: nobody can make themselves an admin from the browser.
--
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query -> paste this whole
-- file -> Run.  Then follow the "FIRST ADMIN" note at the very bottom.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Profiles (one row per auth user; role is assigned by the server, see triggers below)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('client', 'lawyer', 'admin')) default 'client',
  phone text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Emails that are allowed to hold an administrator account (invitation-only).
-- Not readable or writable from the browser; managed here in the SQL editor.
create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Lawyer directory
create table if not exists public.lawyers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  bar_id text not null unique,
  state_bar text default 'Bar Council of Maharashtra & Goa',
  specialisations text[] not null default '{}',
  city text not null,
  languages text[] not null default '{"English", "Hindi"}',
  experience_years integer not null default 1,
  consultation_fee numeric not null default 1000,
  rating numeric default 5.0,
  review_count integer default 0,
  bio text,
  courts text[] default '{"High Court"}',
  certificate_url text,
  verified boolean default false,
  status text check (status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
  avatar_url text,
  submitted_date date default current_date,
  created_at timestamptz default now() not null
);

-- Bookings / appointments
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete set null,
  lawyer_id uuid references public.lawyers(id) on delete set null,
  client_name text not null,
  lawyer_name text not null,
  date date not null,
  time_slot text not null,
  mode text not null check (mode in ('Video', 'Audio', 'Chat', 'In-person')),
  status text not null check (status in ('Confirmed', 'Completed', 'Cancelled', 'Pending')) default 'Confirmed',
  fee numeric not null,
  payment_status text check (payment_status in ('Paid', 'Escrow Hold', 'Refunded', 'Pending')) default 'Paid',
  payment_id text,
  notes text,
  document_ids text[] default '{}',
  created_at timestamptz default now() not null
);

-- Payments ledger
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  payment_id text not null unique,
  order_id text not null,
  booking_id text,
  client_id uuid references public.profiles(id) on delete set null,
  lawyer_id uuid references public.lawyers(id) on delete set null,
  client_name text not null,
  lawyer_name text not null,
  amount numeric not null,
  platform_fee numeric not null default 0,
  net_payout numeric not null default 0,
  currency text not null default 'INR',
  status text not null check (status in ('Completed', 'Escrow Hold', 'Refunded', 'Disputed', 'Failed')) default 'Completed',
  payment_method text not null check (payment_method in ('UPI', 'Card', 'Netbanking', 'Razorpay')) default 'Razorpay',
  transaction_time timestamptz default now() not null,
  notes jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- Documents vault
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  lawyer_id uuid references public.lawyers(id) on delete set null,
  booking_id text,
  client_name text,
  lawyer_name text,
  name text not null,
  file_name text,
  file_url text not null,
  file_size text not null default '1.2 MB',
  category text default 'Court Notice / Summons',
  status text not null check (status in ('Uploaded', 'Pending review', 'In review', 'Reviewed')) default 'Uploaded',
  notes text,
  uploaded_time timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('client', 'lawyer', 'admin')),
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  link text,
  created_at timestamptz default now() not null
);

-- Disputes
create table if not exists public.disputes (
  id text primary key,
  booking_id text not null,
  client_name text not null,
  lawyer_name text not null,
  amount numeric not null,
  reason text not null,
  status text not null check (status in ('Open', 'Refunded', 'Released', 'Under Review')) default 'Open',
  filed_date date default current_date not null,
  resolution_notes text,
  created_at timestamptz default now() not null
);

-- Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  lawyer_id uuid references public.lawyers(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now() not null
);

-- Login history
create table if not exists public.login_history (
  id text primary key,
  user_id text,
  user_email text not null,
  user_name text not null,
  role text not null check (role in ('client', 'lawyer', 'admin')),
  provider text not null check (provider in ('email', 'google', 'demo')) default 'email',
  user_agent text,
  login_at timestamptz default now() not null
);

-- One-time codes for two-step verification.
-- Only the server (service-role key) can touch this table. `otp` holds an HMAC, never the plain code.
create table if not exists public.otp_verification (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  purpose text not null default 'login',
  otp text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  is_verified boolean not null default false,
  created_at timestamptz default now() not null
);

-- Upgrade path for projects created with the previous schema version
alter table public.otp_verification add column if not exists phone text;
alter table public.otp_verification add column if not exists purpose text not null default 'login';
alter table public.otp_verification add column if not exists attempts integer not null default 0;

-- Indexes
create index if not exists idx_otp_verification_email on public.otp_verification(email);
create index if not exists idx_otp_verification_created on public.otp_verification(created_at desc);
create index if not exists idx_otp_verification_active on public.otp_verification(email, is_verified, expires_at);
create index if not exists idx_login_history_user_email on public.login_history(user_email);
create index if not exists idx_login_history_role on public.login_history(role);
create index if not exists idx_login_history_login_at on public.login_history(login_at desc);
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_bookings_client_id on public.bookings(client_id);
create index if not exists idx_bookings_lawyer_id on public.bookings(lawyer_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_lawyers_status on public.lawyers(status);

-- =============================================================================
-- 2. HELPER FUNCTIONS + TRIGGERS (server-controlled roles)
-- =============================================================================

-- True when the calling user is an administrator. SECURITY DEFINER so policies can use it
-- without recursive RLS lookups on public.profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- New auth user -> profile. The role is decided HERE, not by the browser:
--   'lawyer' is accepted as requested, 'admin' only for emails in public.admin_allowlist,
--   everything else becomes 'client'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := lower(coalesce(new.raw_user_meta_data->>'role', 'client'));
  final_role text := 'client';
begin
  if requested_role = 'lawyer' then
    final_role := 'lawyer';
  elsif requested_role = 'admin'
        and exists (select 1 from public.admin_allowlist a where a.email = lower(new.email)) then
    final_role := 'admin';
  end if;

  insert into public.profiles (id, name, email, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    final_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody can change a profile's role from the browser (anon / authenticated JWTs).
-- The SQL editor and the service-role key are allowed, so admins are managed there.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
declare
  jwt_role text := coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb) ->> 'role', '');
begin
  if jwt_role in ('anon', 'authenticated') then
    raise exception 'Account roles can only be changed by the platform administrator.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update of role on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.protect_profile_role();

-- Non-admins cannot verify/approve themselves or edit rating fields on lawyer rows.
create or replace function public.protect_lawyer_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb) ->> 'role', '');
begin
  if jwt_role in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.verified := false;
      new.status := 'Pending';
      new.rating := 5.0;
      new.review_count := 0;
      new.user_id := auth.uid();
    else
      new.verified := old.verified;
      new.status := old.status;
      new.rating := old.rating;
      new.review_count := old.review_count;
      new.user_id := old.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_lawyer_admin_fields on public.lawyers;
create trigger protect_lawyer_admin_fields
  before insert or update on public.lawyers
  for each row execute function public.protect_lawyer_admin_fields();

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.admin_allowlist  enable row level security;
alter table public.lawyers          enable row level security;
alter table public.bookings         enable row level security;
alter table public.payments         enable row level security;
alter table public.documents        enable row level security;
alter table public.notifications    enable row level security;
alter table public.disputes         enable row level security;
alter table public.reviews          enable row level security;
alter table public.login_history    enable row level security;
alter table public.otp_verification enable row level security;

-- Remove every previously created policy on these tables (the old ones were too permissive),
-- then recreate the secure set below.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'admin_allowlist', 'lawyers', 'bookings', 'payments', 'documents',
                        'notifications', 'disputes', 'reviews', 'login_history', 'otp_verification')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;

-- profiles: you see and edit only your own row (admins see all). Roles are protected by the trigger above.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_insert_own_as_client" on public.profiles
  for insert with check (auth.uid() = id and role = 'client');
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- lawyers: public directory shows approved lawyers only; owners see their own row; admins see all.
create policy "lawyers_select_approved_own_or_admin" on public.lawyers
  for select using (status = 'Approved' or user_id = auth.uid() or public.is_admin());
create policy "lawyers_insert_authenticated" on public.lawyers
  for insert with check (auth.uid() is not null);
create policy "lawyers_update_own_or_admin" on public.lawyers
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- bookings: participants (client or the booked lawyer) and admins
create policy "bookings_select_participants_or_admin" on public.bookings
  for select using (
    auth.uid() = client_id
    or exists (select 1 from public.lawyers l where l.id = bookings.lawyer_id and l.user_id = auth.uid())
    or public.is_admin()
  );
create policy "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() is not null and (client_id is null or client_id = auth.uid()));
create policy "bookings_update_participants_or_admin" on public.bookings
  for update using (
    auth.uid() = client_id
    or exists (select 1 from public.lawyers l where l.id = bookings.lawyer_id and l.user_id = auth.uid())
    or public.is_admin()
  );

-- payments
create policy "payments_select_participants_or_admin" on public.payments
  for select using (
    auth.uid() = client_id
    or exists (select 1 from public.lawyers l where l.id = payments.lawyer_id and l.user_id = auth.uid())
    or public.is_admin()
  );
create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() is not null and (client_id is null or client_id = auth.uid()));

-- documents: uploader, the client it belongs to, the assigned lawyer, and admins
create policy "documents_select_involved_or_admin" on public.documents
  for select using (
    auth.uid() = user_id
    or auth.uid() = client_id
    or exists (select 1 from public.lawyers l where l.id = documents.lawyer_id and l.user_id = auth.uid())
    or public.is_admin()
  );
create policy "documents_insert_involved" on public.documents
  for insert with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or auth.uid() = client_id
      or exists (select 1 from public.lawyers l where l.id = documents.lawyer_id and l.user_id = auth.uid())
    )
  );
create policy "documents_update_involved_or_admin" on public.documents
  for update using (
    auth.uid() = user_id
    or exists (select 1 from public.lawyers l where l.id = documents.lawyer_id and l.user_id = auth.uid())
    or public.is_admin()
  );

-- notifications: yours, plus admin broadcasts (user_id is null) for admins
create policy "notifications_select_own_or_admin_broadcast" on public.notifications
  for select using (
    auth.uid() = user_id
    or (user_id is null and role = 'admin' and public.is_admin())
  );
create policy "notifications_insert_authenticated" on public.notifications
  for insert with check (auth.uid() is not null);
create policy "notifications_update_own_or_admin_broadcast" on public.notifications
  for update using (
    auth.uid() = user_id
    or (user_id is null and role = 'admin' and public.is_admin())
  );

-- disputes: admin only to read/resolve; any signed-in user may file one
create policy "disputes_admin_all" on public.disputes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "disputes_insert_authenticated" on public.disputes
  for insert with check (auth.uid() is not null);

-- reviews: public to read; signed-in clients write as themselves
create policy "reviews_select_all" on public.reviews
  for select using (true);
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() is not null and (client_id is null or client_id = auth.uid()));

-- login history: admins (or the user themselves) can read; signed-in users can write
create policy "login_history_select_admin_or_own" on public.login_history
  for select using (public.is_admin() or auth.uid()::text = user_id);
create policy "login_history_insert_authenticated" on public.login_history
  for insert with check (auth.uid() is not null);

-- otp_verification and admin_allowlist: intentionally NO policies.
-- With RLS on and no policy, only the service-role key (server) and the SQL editor can access them.
revoke all on public.otp_verification from anon, authenticated;
revoke all on public.admin_allowlist  from anon, authenticated;

-- =============================================================================
-- 4. STORAGE (private buckets; the app does not use public file URLs)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false), ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

drop policy if exists "Public Access to Documents" on storage.objects;
drop policy if exists "Authenticated Users can Upload Documents" on storage.objects;

-- =============================================================================
-- 5. SAMPLE DATA (approved demo advocates so the directory is not empty)
-- =============================================================================
insert into public.lawyers (
  name, bar_id, state_bar, specialisations, city, languages,
  experience_years, consultation_fee, rating, review_count,
  bio, courts, verified, status, avatar_url
)
values
  (
    'Adv. Ananya Iyer', 'MAH/1824/2012', 'Bar Council of Maharashtra & Goa',
    array['Criminal Law', 'Cyber Crime', 'White Collar Defense'], 'Mumbai',
    array['English', 'Hindi', 'Marathi'], 14, 2400, 4.9, 142,
    'Advocate practicing in Bombay High Court and City Civil & Sessions Courts.',
    array['Bombay High Court'], true, 'Approved',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80'
  ),
  (
    'Adv. Rajeshwar Sharma', 'DL/3309/2009', 'Bar Council of Delhi',
    array['Corporate Law', 'Commercial Contracts', 'M&A', 'Startups'], 'New Delhi',
    array['English', 'Hindi', 'Punjabi'], 17, 3200, 4.95, 218,
    'Dual-qualified corporate counsel advising funded startups.',
    array['Delhi High Court'], true, 'Approved',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80'
  ),
  (
    'Adv. Meera Sundaram', 'KA/0912/2015', 'Karnataka State Bar Council',
    array['Family & Divorce', 'Child Custody', 'Domestic Violence', 'Mediation'], 'Bengaluru',
    array['English', 'Kannada', 'Tamil', 'Hindi'], 11, 1800, 4.88, 96,
    'Trained mediator and family court advocate.',
    array['High Court of Karnataka'], true, 'Approved',
    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&q=80'
  ),
  (
    'Adv. Vikramaditya Sen', 'WB/4411/2006', 'Bar Council of West Bengal',
    array['Property & Real Estate', 'Tenancy Disputes', 'Title Verification', 'RERA'], 'Kolkata',
    array['English', 'Bengali', 'Hindi'], 20, 2600, 4.92, 184,
    'Senior real-estate advocate.',
    array['Calcutta High Court'], true, 'Approved',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'
  )
on conflict (bar_id) do nothing;

-- =============================================================================
-- FIRST ADMIN  (run ONCE, with your own email, in a separate query)
-- -----------------------------------------------------------------------------
--   insert into public.admin_allowlist (email) values ('you@example.com')
--   on conflict do nothing;
--
-- Then open /auth/admin/register and sign up with that exact email.
-- If that account already exists, promote it directly instead:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================
