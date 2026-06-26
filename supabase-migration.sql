-- ============================================================
-- ElectroGestor — Single-tenant migration
-- ============================================================
-- Corré UNA VEZ en el SQL Editor de Supabase.
-- Antes, ejecutá el script de reset para borrar lo anterior.
--
-- Para deploy:
--   1. Crear proyecto Supabase
--   2. Ir a SQL Editor
--   3. Pegar TODO y ejecutar
--   4. Habilitar Google OAuth en Authentication > Providers
--   5. Configurar .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
-- ============================================================

-- 1. Companies (empresa única — solo una fila)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi Empresa',
  created_at timestamptz not null default now()
);

-- 2. Company users (relación usuario ↔ empresa)
create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  is_root boolean not null default false,
  created_at timestamptz not null default now()
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

-- 10. Invoice numbering sequence (atomic, DB-side)
create table if not exists public.invoices_sequence (
  company_id uuid primary key references public.companies(id) on delete cascade,
  last_number int not null default 0
);

-- ============================================================
-- Invoice number allocation function (atomic)
-- ============================================================
create or replace function public.next_invoice_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
begin
  insert into public.invoices_sequence (company_id, last_number)
  values (p_company_id, 1)
  on conflict (company_id) do update
    set last_number = invoices_sequence.last_number + 1
  returning last_number into v_next;
  return 'FAC-' || lpad(v_next::text, 4, '0');
end;
$$;

-- ============================================================
-- Bootstrap function: crea la empresa + root admin
-- ============================================================
-- Si no hay empresa → la crea y agrega al usuario como root.
-- Si hay empresa pero no tiene usuarios (migración incompleta)
--   → agrega a este usuario como root (edge case recovery).
-- Si hay empresa CON usuarios → error (necesita que lo agregue un admin).
create or replace function public.bootstrap_company(user_id text, user_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_count int;
begin
  -- Buscar o crear la empresa única
  select id into v_company_id from public.companies limit 1;

  if v_company_id is null then
    insert into public.companies (name) values ('Mi Empresa')
    returning id into v_company_id;
  else
    -- Ya hay empresa: chequear si tiene usuarios
    select count(*) into v_user_count from public.company_users
    where company_id = v_company_id;

    if v_user_count > 0 then
      raise exception 'Ya existe una empresa en el sistema. Contactá a tu administrador.';
    end if;
    -- Sin usuarios todavía → se considera primer bootstrap
  end if;

  -- Agregar usuario como root admin
  insert into public.company_users (company_id, user_id, email, role, is_root)
  values (v_company_id, user_id::uuid, user_email, 'admin', true);

  return v_company_id;
end;
$$;

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
-- Row Level Security (single-tenant, con company_id por rol)
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

-- Companies: users can read their company
create policy "company_users can read their company"
on public.companies for select
using (id = public.get_user_company_id());

-- Companies: admins can update name
create policy "admins can update their company"
on public.companies for update
using (id = public.get_user_company_id())
with check (id = public.get_user_company_id());

-- Company users: read own company users
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

-- Quotes
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

-- Invoices sequence
alter table public.invoices_sequence enable row level security;
create policy "company_scoped_select" on public.invoices_sequence for select
  using (company_id = public.get_user_company_id());
create policy "company_scoped_insert" on public.invoices_sequence for insert
  with check (company_id = public.get_user_company_id());
create policy "company_scoped_update" on public.invoices_sequence for update
  using (company_id = public.get_user_company_id());

-- ============================================================
-- Grant execute on helper functions
-- ============================================================
grant execute on function public.bootstrap_company(text, text) to authenticated;
grant execute on function public.next_invoice_number to authenticated;
