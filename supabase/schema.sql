-- LockInTalks Supabase setup
-- Paste this into Supabase Dashboard > SQL Editor > New query, then click Run.
-- This table works with Supabase Auth. Each registration belongs to auth.users.id.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  age_group text not null,
  event_date text not null,
  event_time text not null default 'TBA',
  timezone text not null default 'IST',
  registration_deadline text,
  max_participants integer not null default 50 check (max_participants > 0),
  fee_label text not null,
  fee_amount integer not null default 0,
  summary text not null,
  description text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'live', 'closed')),
  rules text[] not null default '{}',
  schedule text[] not null default '{}',
  prizes text[] not null default '{}',
  criteria text[] not null default '{}',
  judges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitions enable row level security;

alter table public.competitions
add column if not exists event_time text not null default 'TBA',
add column if not exists timezone text not null default 'IST',
add column if not exists registration_deadline text,
add column if not exists max_participants integer not null default 50,
add column if not exists criteria text[] not null default '{}';

alter table public.competitions
drop constraint if exists competitions_max_participants_check;

alter table public.competitions
add constraint competitions_max_participants_check
check (max_participants > 0);

alter table public.competitions
drop constraint if exists competitions_status_check;

update public.competitions set status = 'live' where status = 'published';
update public.competitions set status = 'closed' where status = 'archived';

alter table public.competitions
add constraint competitions_status_check
check (status in ('draft', 'live', 'closed'));

drop policy if exists "Anyone can read published competitions" on public.competitions;
drop policy if exists "Anyone can read live competitions" on public.competitions;
create policy "Anyone can read live competitions"
on public.competitions
for select
to anon, authenticated
using (status = 'live');

drop policy if exists "Admins can manage competitions" on public.competitions;
create policy "Admins can manage competitions"
on public.competitions
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_slug text not null,
  competition_name text not null,
  student_name text not null,
  student_age integer not null check (student_age between 6 and 19),
  guardian_name text not null,
  guardian_email text not null,
  city text,
  country text,
  city_country text not null,
  entry_fee text not null,
  registration_status text not null default 'submitted' check (registration_status in ('submitted', 'payment_pending', 'paid', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  age_proof_status text not null default 'not_required_yet' check (age_proof_status in ('not_required_yet', 'requested', 'submitted', 'approved', 'rejected')),
  payment_required boolean not null default true,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'order_created', 'payment_created', 'signature_verified', 'captured', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider text not null default 'razorpay',
  payment_order_id text,
  payment_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount_due integer,
  amount_paid integer,
  confirmation_email_sent boolean not null default false,
  confirmation_email_sent_at timestamptz,
  confirmation_email_sent_by uuid,
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  points_discount_amount integer not null default 0 check (points_discount_amount >= 0),
  payment_amount integer,
  payment_currency text default 'INR',
  seat_confirmed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registrations
add column if not exists city text,
add column if not exists country text,
add column if not exists registration_status text not null default 'submitted',
add column if not exists age_proof_status text not null default 'not_required_yet',
add column if not exists payment_required boolean not null default true,
add column if not exists payment_provider text not null default 'razorpay',
add column if not exists payment_order_id text,
add column if not exists payment_id text,
add column if not exists razorpay_order_id text,
add column if not exists razorpay_payment_id text,
add column if not exists razorpay_signature text,
add column if not exists amount_due integer,
add column if not exists amount_paid integer,
add column if not exists confirmation_email_sent boolean not null default false,
add column if not exists confirmation_email_sent_at timestamptz,
add column if not exists confirmation_email_sent_by uuid,
add column if not exists points_redeemed integer not null default 0,
add column if not exists points_discount_amount integer not null default 0,
add column if not exists payment_amount integer,
add column if not exists payment_currency text default 'INR',
add column if not exists seat_confirmed_at timestamptz,
add column if not exists paid_at timestamptz,
add column if not exists updated_at timestamptz not null default now();

update public.registrations
set
  city = coalesce(city, nullif(split_part(city_country, ',', 1), '')),
  country = coalesce(country, nullif(trim(substr(city_country, length(split_part(city_country, ',', 1)) + 2)), ''))
where city is null or country is null;

alter table public.registrations
drop constraint if exists registrations_payment_status_check;

alter table public.registrations
drop constraint if exists registrations_registration_status_check;

alter table public.registrations
drop constraint if exists registrations_age_proof_status_check;

alter table public.registrations
drop constraint if exists registrations_points_redeemed_check;

alter table public.registrations
drop constraint if exists registrations_points_discount_amount_check;

update public.registrations
set payment_status = 'order_created'
where payment_status = 'payment_created';

update public.registrations
set
  payment_order_id = coalesce(payment_order_id, razorpay_order_id),
  payment_id = coalesce(payment_id, razorpay_payment_id),
  amount_due = coalesce(amount_due, payment_amount),
  amount_paid = coalesce(amount_paid, case when payment_status in ('paid', 'captured') then payment_amount else null end),
  registration_status = case
    when payment_status in ('paid', 'captured') then 'accepted'
    when payment_status in ('failed', 'cancelled', 'refunded') then 'payment_pending'
    else coalesce(registration_status, 'submitted')
  end,
  seat_confirmed_at = coalesce(seat_confirmed_at, case when payment_status in ('paid', 'captured') then paid_at else null end),
  updated_at = coalesce(updated_at, created_at, now());

alter table public.registrations
add constraint registrations_payment_status_check
check (payment_status in ('pending', 'order_created', 'payment_created', 'signature_verified', 'captured', 'paid', 'failed', 'cancelled', 'refunded'));

alter table public.registrations
add constraint registrations_registration_status_check
check (registration_status in ('submitted', 'payment_pending', 'paid', 'under_review', 'accepted', 'rejected', 'withdrawn'));

alter table public.registrations
add constraint registrations_age_proof_status_check
check (age_proof_status in ('not_required_yet', 'requested', 'submitted', 'approved', 'rejected'));

alter table public.registrations
add constraint registrations_points_redeemed_check
check (points_redeemed >= 0);

alter table public.registrations
add constraint registrations_points_discount_amount_check
check (points_discount_amount >= 0);

create index if not exists registrations_user_id_idx
on public.registrations (user_id);

create index if not exists registrations_created_at_idx
on public.registrations (created_at desc);

create index if not exists registrations_razorpay_order_id_idx
on public.registrations (razorpay_order_id);

create index if not exists registrations_payment_order_id_idx
on public.registrations (payment_order_id);

create index if not exists registrations_registration_status_idx
on public.registrations (registration_status);

create index if not exists registrations_age_proof_status_idx
on public.registrations (age_proof_status);

create index if not exists registrations_payment_status_idx
on public.registrations (payment_status);

create index if not exists profiles_role_idx
on public.profiles (role);

create index if not exists competitions_status_idx
on public.competitions (status);

create index if not exists competitions_slug_idx
on public.competitions (slug);

create table if not exists public.lockin_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  competition_slug text,
  points integer not null check (points <> 0),
  type text not null check (type in ('participation', 'milestone', 'winner', 'redemption', 'refund_reversal', 'admin_adjustment')),
  description text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.lockin_points_ledger enable row level security;

create index if not exists lockin_points_ledger_user_id_idx
on public.lockin_points_ledger (user_id);

create index if not exists lockin_points_ledger_registration_id_idx
on public.lockin_points_ledger (registration_id);

create index if not exists lockin_points_ledger_type_idx
on public.lockin_points_ledger (type);

create index if not exists lockin_points_ledger_created_at_idx
on public.lockin_points_ledger (created_at desc);

drop policy if exists "Users can read own Lock-in Points ledger" on public.lockin_points_ledger;
create policy "Users can read own Lock-in Points ledger"
on public.lockin_points_ledger
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can manage Lock-in Points ledger" on public.lockin_points_ledger;
create policy "Admins can manage Lock-in Points ledger"
on public.lockin_points_ledger
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

alter table public.registrations enable row level security;

drop policy if exists "Users can read own registrations" on public.registrations;
create policy "Users can read own registrations"
on public.registrations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own registrations" on public.registrations;
create policy "Users can create own registrations"
on public.registrations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own registrations" on public.registrations;
create policy "Users can update own registrations"
on public.registrations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and payment_status not in ('paid', 'captured'));

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text not null,
  provider_payment_id text,
  amount integer not null default 0,
  currency text not null default 'INR',
  status text not null default 'created',
  signature_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

alter table public.payment_attempts enable row level security;

create index if not exists payment_attempts_registration_id_idx
on public.payment_attempts (registration_id);

create index if not exists payment_attempts_user_id_idx
on public.payment_attempts (user_id);

create index if not exists payment_attempts_provider_order_id_idx
on public.payment_attempts (provider_order_id);

drop policy if exists "Users can read own payment attempts" on public.payment_attempts;
create policy "Users can read own payment attempts"
on public.payment_attempts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can manage payment attempts" on public.payment_attempts;
create policy "Admins can manage payment attempts"
on public.payment_attempts
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text not null unique,
  event_type text not null,
  provider_order_id text,
  provider_payment_id text,
  registration_id uuid references public.registrations(id) on delete set null,
  raw_payload jsonb not null,
  processed boolean not null default false,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.payment_events enable row level security;

create index if not exists payment_events_provider_event_id_idx
on public.payment_events (provider_event_id);

create index if not exists payment_events_provider_order_id_idx
on public.payment_events (provider_order_id);

create index if not exists payment_events_registration_id_idx
on public.payment_events (registration_id);

drop policy if exists "Admins can read payment events" on public.payment_events;
create policy "Admins can read payment events"
on public.payment_events
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can manage payment events" on public.payment_events;
create policy "Admins can manage payment events"
on public.payment_events
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into storage.buckets (id, name, public)
values ('competition-images', 'competition-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read competition images" on storage.objects;
create policy "Anyone can read competition images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'competition-images');

drop policy if exists "Admins can upload competition images" on storage.objects;
create policy "Admins can upload competition images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'competition-images'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can update competition images" on storage.objects;
create policy "Admins can update competition images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'competition-images'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  bucket_id = 'competition-images'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

drop policy if exists "Admins can delete competition images" on storage.objects;
create policy "Admins can delete competition images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'competition-images'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
