-- LockInTalks Supabase setup
-- Paste this into Supabase Dashboard > SQL Editor > New query, then click Run.

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
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

drop policy if exists "Users can read own registrations" on public.registrations;
create policy "Users can read own registrations"
on public.registrations
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own registrations" on public.registrations;
create policy "Users can create own registrations"
on public.registrations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own registrations" on public.registrations;
create policy "Users can update own registrations"
on public.registrations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
