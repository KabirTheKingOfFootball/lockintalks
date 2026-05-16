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
  fee_label text not null,
  fee_amount integer not null default 0,
  summary text not null,
  description text not null,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'live', 'closed')),
  rules text[] not null default '{}',
  schedule text[] not null default '{}',
  prizes text[] not null default '{}',
  judges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.competitions enable row level security;

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

create index if not exists registrations_payment_status_idx
on public.registrations (payment_status);

create index if not exists profiles_role_idx
on public.profiles (role);

create index if not exists competitions_status_idx
on public.competitions (status);

create index if not exists competitions_slug_idx
on public.competitions (slug);

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
