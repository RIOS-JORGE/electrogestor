-- ============================================================
-- ElectroGestor — Multi-tenant migration
-- Corré esto en Supabase SQL Editor (una vez, en orden)
-- ============================================================

-- 1. Companies (empresas)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Company users (relación usuario ↔ empresa)
create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- 3. Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Quotes (cotizaciones)
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  iva numeric(5,2),
  discount numeric(5,2),
  total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Invoices (facturas)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text not null,
  quote_id uuid references public.quotes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  iva numeric(5,2),
  discount numeric(5,2),
  total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  notes text not null default '',
  issued_at timestamptz,
  paid_at timestamptz,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number)
);

-- 6. Products (inventario)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null check (category in ('cable', 'tablero', 'interruptor', 'herramienta', 'otro')),
  unit text not null,
  stock numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 0,
  unit_price numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Stock movements
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjustment')),
  quantity numeric(12,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

-- 8. Appointments (agenda)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  client_name text not null default '',
  client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  date date not null,
  time time,
  duration_minutes int,
  notes text,
  address text,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Settings (configuración por empresa)
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  mp_alias text not null default '',
  business_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_clients_company on public.clients(company_id);
create index if not exists idx_quotes_company on public.quotes(company_id);
create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_stock_movements_company on public.stock_movements(company_id);
create index if not exists idx_appointments_company on public.appointments(company_id);
create index if not exists idx_company_users_user on public.company_users(user_id);

-- ============================================================
-- Helper function: gets the company_id for the current user
-- ============================================================
create or replace function public.get_user_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.company_users
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- Row Level Security (multi-tenant)
-- ============================================================

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.appointments enable row level security;
alter table public.settings enable row level security;

-- Companies: admins can read
create policy "company_users can read their company"
on public.companies for select
using (id = public.get_user_company_id());

-- Company users: read own + admins read all in company
create policy "users can read own company users"
on public.company_users for select
using (company_id = public.get_user_company_id());

-- Clients: company-scoped
create policy "company_scoped_select" on public.clients for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.clients for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.clients for update
  using (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.clients for delete
  using (company_id = public.get_user_company_id());

-- Quotes (same pattern, one policy per operation)
create policy "company_scoped_select" on public.quotes for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.quotes for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.quotes for update
  using (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.quotes for delete
  using (company_id = public.get_user_company_id());

-- Invoices
create policy "company_scoped_select" on public.invoices for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.invoices for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.invoices for update
  using (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.invoices for delete
  using (company_id = public.get_user_company_id());

-- Products
create policy "company_scoped_select" on public.products for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.products for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.products for update
  using (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.products for delete
  using (company_id = public.get_user_company_id());

-- Stock movements
create policy "company_scoped_select" on public.stock_movements for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.stock_movements for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.stock_movements for delete
  using (company_id = public.get_user_company_id());

-- Appointments
create policy "company_scoped_select" on public.appointments for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.appointments for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.appointments for update
  using (company_id = public.get_user_company_id());
create policy "company_scoped_delete" on public.appointments for delete
  using (company_id = public.get_user_company_id());

-- Settings
create policy "company_scoped_select" on public.settings for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.settings for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.settings for update
  using (company_id = public.get_user_company_id());
