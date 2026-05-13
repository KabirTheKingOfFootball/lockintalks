-- LockInTalks Supabase setup
-- Paste this into Supabase Dashboard > SQL Editor > New query, then click Run.
-- This table works with Supabase Auth. Each registration belongs to auth.users.id.

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_slug text not null,
  competition_name text not null,
  student_name text not null,
  student_age integer not null check (student_age between 6 and 19),
  guardian_name text not null,
  guardian_email text not null,
  city_country text not null,
  entry_fee text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'payment_created', 'paid', 'failed', 'cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_amount integer,
  payment_currency text default 'INR',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.registrations
add column if not exists razorpay_order_id text,
add column if not exists razorpay_payment_id text,
add column if not exists razorpay_signature text,
add column if not exists payment_amount integer,
add column if not exists payment_currency text default 'INR',
add column if not exists paid_at timestamptz;

alter table public.registrations
drop constraint if exists registrations_payment_status_check;

alter table public.registrations
add constraint registrations_payment_status_check
check (payment_status in ('pending', 'payment_created', 'paid', 'failed', 'cancelled'));

create index if not exists registrations_user_id_idx
on public.registrations (user_id);

create index if not exists registrations_created_at_idx
on public.registrations (created_at desc);

create index if not exists registrations_razorpay_order_id_idx
on public.registrations (razorpay_order_id);

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
with check (auth.uid() = user_id and payment_status <> 'paid');
