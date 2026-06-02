-- ============================================================
-- Credit Management Platform - Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type application_status as enum (
  'draft',
  'submitted',
  'kyc_verification',
  'analysis',
  'additional_docs_required',
  'approved',
  'rejected',
  'disbursed'
);

create type document_type as enum (
  'id_front',
  'id_back',
  'selfie',
  'income_proof',
  'address_proof'
);

create type internal_role as enum (
  'agent',
  'supervisor',
  'admin'
);

create type loan_type as enum (
  'personal',
  'auto',
  'mortgage',
  'business',
  'education'
);

create type contract_type as enum (
  'cdi',
  'cdd',
  'freelance',
  'retired',
  'other'
);

-- ============================================================
-- PROFILES (client users, linked to Supabase Auth)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text not null,
  date_of_birth date,
  gender text,
  nationality text,
  address text,
  profession text,
  employer text,
  seniority_years integer,
  contract_type contract_type,
  monthly_income numeric(12,2),
  monthly_expenses numeric(12,2),
  other_credits numeric(12,2) default 0,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ============================================================
-- INTERNAL USERS (bank staff)
-- ============================================================

create table internal_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null,
  password_hash text not null,
  role internal_role not null default 'agent',
  is_active boolean not null default true,
  created_at timestamptz default now() not null
);

-- No RLS needed — accessed only via service role key server-side

-- ============================================================
-- LOAN APPLICATIONS
-- ============================================================

create sequence loan_application_seq start 1000;

create table loan_applications (
  id uuid primary key default uuid_generate_v4(),
  application_number text unique not null default 'CR-' || nextval('loan_application_seq'),
  client_id uuid not null references profiles(id) on delete cascade,
  loan_type loan_type,
  amount numeric(14,2),
  duration_months integer,
  purpose text,
  status application_status not null default 'draft',
  assigned_to uuid references internal_users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  submitted_at timestamptz
);

alter table loan_applications enable row level security;

create policy "Clients can view own applications"
  on loan_applications for select using (auth.uid() = client_id);

create policy "Clients can insert own applications"
  on loan_applications for insert with check (auth.uid() = client_id);

create policy "Clients can update own draft applications"
  on loan_applications for update
  using (auth.uid() = client_id and status = 'draft');

-- Function to auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger loan_applications_updated_at
  before update on loan_applications
  for each row execute function update_updated_at();

-- ============================================================
-- LOAN DOCUMENTS
-- ============================================================

create table loan_documents (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references loan_applications(id) on delete cascade,
  document_type document_type not null,
  file_url text not null,
  file_name text not null,
  uploaded_at timestamptz default now() not null
);

alter table loan_documents enable row level security;

create policy "Clients can view own documents"
  on loan_documents for select
  using (
    exists (
      select 1 from loan_applications la
      where la.id = application_id and la.client_id = auth.uid()
    )
  );

create policy "Clients can insert own documents"
  on loan_documents for insert
  with check (
    exists (
      select 1 from loan_applications la
      where la.id = application_id and la.client_id = auth.uid()
    )
  );

-- ============================================================
-- APPLICATION STATUS HISTORY
-- ============================================================

create table application_status_history (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references loan_applications(id) on delete cascade,
  status application_status not null,
  changed_by uuid references internal_users(id) on delete set null,
  changed_at timestamptz default now() not null,
  note text
);

alter table application_status_history enable row level security;

create policy "Clients can view own application history"
  on application_status_history for select
  using (
    exists (
      select 1 from loan_applications la
      where la.id = application_id and la.client_id = auth.uid()
    )
  );

-- ============================================================
-- APPLICATION COMMENTS (internal only)
-- ============================================================

create table application_comments (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null references loan_applications(id) on delete cascade,
  author_id uuid not null references internal_users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null
);

-- No client RLS — accessed server-side by bank staff only

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz default now() not null
);

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this separately or via Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false);

-- Storage RLS:
-- create policy "Authenticated clients can upload"
--   on storage.objects for insert
--   with check (bucket_id = 'kyc-documents' and auth.role() = 'authenticated');

-- create policy "Clients can view own files"
--   on storage.objects for select
--   using (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);
