-- Slice 1: free-scan lead capture (work email + company size only).
-- No org/tenant model yet - that lands in slice 3 alongside uploads.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  work_email text not null,
  company_size text not null check (
    company_size in ('under_50', '50_200', '201_500', '501_1000', '1001_2000', 'over_2000')
  ),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Anonymous visitors may only ever insert their own lead row - never read,
-- update, or delete any row, their own included. Reading leads back is an
-- operator/admin task and goes through the service role, not this policy.
create policy "anon_can_insert_leads"
  on public.leads
  for insert
  to anon
  with check (true);
