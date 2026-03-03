-- Strategy Control Room Schema v1
-- Author: Antigravity
-- Date: 2026-01-23

-- 1. STAKEHOLDERS (Core Entity)
create table stakeholders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text,
  influence text, -- 'High', 'Medium', 'Low'
  interest text, -- 'High', 'Medium', 'Low'
  posture_status text, -- 'Active', 'Monitor', 'Needs Attention', 'Stable'
  posture_current text,
  posture_desired text,
  narrative_hook text,
  engagement_strategy text,
  owner text
);

-- 2. CONTACTS (Relational - One-to-Many)
create table contacts (
  id uuid default gen_random_uuid() primary key,
  stakeholder_id uuid references stakeholders(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- 'Mayor Cr Jones'
  role text, -- 'Mayor', 'CEO', 'Electorate Officer'
  email text,
  phone text,
  address text,
  notes text,
  is_primary boolean default false
);

-- 3. POSTURE HISTORY (Temporal Tracking)
create table posture_history (
  id uuid default gen_random_uuid() primary key,
  stakeholder_id uuid references stakeholders(id) on delete cascade not null,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  previous_status text,
  new_status text,
  notes text
);

-- 4. ACTIVITY LOG (Updated for Relations)
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  type text not null, -- 'Meeting', 'Email', etc.
  summary text not null,
  description text,
  stakeholder_id uuid references stakeholders(id) on delete set null
  -- Note: We can add a many-to-many join table for multiple stakeholders later if strictly needed.
  -- For now, a simple FK or an array of UUIDs in a text[] column works for the MVP adaptation.
);

-- 5. DECISIONS
create table decisions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  title text not null,
  context text,
  status text -- 'Draft', 'Approved'
);

-- 6. ACTIONS
create table actions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  activity text not null,
  owner text,
  status text, -- 'Pending', 'In Progress', 'Complete'
  link_type text, -- 'Stakeholder', 'Objective'
  link_id text -- Could be UUID or String ID (e.g. 'obj1')
);

-- 7. SPINE (Single Row Config)
create table spine (
  id integer primary key default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content jsonb not null
);

-- RLS POLICIES (Security Baseline)
alter table stakeholders enable row level security;
alter table contacts enable row level security;
alter table posture_history enable row level security;
alter table activity_log enable row level security;
alter table decisions enable row level security;
alter table actions enable row level security;
alter table spine enable row level security;

-- Policy: Allow Public Read/Write (Demo Mode / Internal Tool Mode)
-- In production, replace 'true' with proper auth checks (e.g. auth.uid() = user_id)
create policy "Enable all access for all users" on stakeholders for all using (true) with check (true);
create policy "Enable all access for all users" on contacts for all using (true) with check (true);
create policy "Enable all access for all users" on posture_history for all using (true) with check (true);
create policy "Enable all access for all users" on activity_log for all using (true) with check (true);
create policy "Enable all access for all users" on decisions for all using (true) with check (true);
create policy "Enable all access for all users" on actions for all using (true) with check (true);
create policy "Enable all access for all users" on spine for all using (true) with check (true);
