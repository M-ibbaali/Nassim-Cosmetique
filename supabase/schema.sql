-- ============================================================
-- MAKEUP SHOP POS — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (Syncs with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'admin' check (role in ('admin', 'staff')),
  updated_at timestamptz default now()
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger to sync auth.users -> public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  price          numeric(10,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url      text,
  category_id    uuid references public.categories(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Sales
create table if not exists public.sales (
  id         uuid primary key default gen_random_uuid(),
  total      numeric(10,2) not null default 0,
  notes      text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Sale Items
create table if not exists public.sale_items (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity   integer not null check (quantity > 0),
  price      numeric(10,2) not null check (price >= 0),
  subtotal   numeric(10,2) generated always as (quantity * price) stored
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_sales_created_by on public.sales(created_by);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ATOMIC SALE CREATION (prevents race conditions on stock)
-- ============================================================
create or replace function public.create_sale_atomic(
  p_notes text,
  p_user_id uuid,
  p_items jsonb  -- [{ product_id, quantity, price }]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_sale_id uuid;
  v_total   numeric(10,2) := 0;
  v_item    jsonb;
  v_stock   integer;
begin
  -- Validate stock for all items first
  for v_item in select * from jsonb_array_elements(p_items) loop
    select stock_quantity into v_stock
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;  -- row-level lock

    if v_stock is null then
      raise exception 'Product % not found', v_item->>'product_id';
    end if;

    if v_stock < (v_item->>'quantity')::integer then
      raise exception 'Insufficient stock for product %', v_item->>'product_id';
    end if;
  end loop;

  -- Create sale record
  insert into public.sales (notes, created_by, total)
  values (p_notes, p_user_id, 0)
  returning id into v_sale_id;

  -- Insert items and reduce stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.sale_items (sale_id, product_id, quantity, price)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric
    );

    -- Reduce stock
    update public.products
    set stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    where id = (v_item->>'product_id')::uuid;

    -- Accumulate total
    v_total := v_total + ((v_item->>'quantity')::integer * (v_item->>'price')::numeric);
  end loop;

  -- Update sale total
  update public.sales set total = v_total where id = v_sale_id;

  return v_sale_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.sales       enable row level security;
alter table public.sale_items  enable row level security;

-- Authenticated users can read everything
drop policy if exists "auth_read_categories" on public.categories;
create policy "auth_read_categories"  on public.categories  for select to authenticated using (true);
drop policy if exists "auth_read_products" on public.products;
create policy "auth_read_products"    on public.products    for select to authenticated using (true);
drop policy if exists "auth_read_sales" on public.sales;
create policy "auth_read_sales"       on public.sales       for select to authenticated using (true);
drop policy if exists "auth_read_sale_items" on public.sale_items;
create policy "auth_read_sale_items"  on public.sale_items  for select to authenticated using (true);

-- Authenticated users can mutate categories & products
drop policy if exists "auth_insert_categories" on public.categories;
create policy "auth_insert_categories" on public.categories for insert to authenticated with check (true);
drop policy if exists "auth_update_categories" on public.categories;
create policy "auth_update_categories" on public.categories for update to authenticated using (true);
drop policy if exists "auth_delete_categories" on public.categories;
create policy "auth_delete_categories" on public.categories for delete to authenticated using (true);

drop policy if exists "auth_insert_products" on public.products;
create policy "auth_insert_products" on public.products for insert to authenticated with check (true);
drop policy if exists "auth_update_products" on public.products;
create policy "auth_update_products" on public.products for update to authenticated using (true);
drop policy if exists "auth_delete_products" on public.products;
create policy "auth_delete_products" on public.products for delete to authenticated using (true);

drop policy if exists "auth_insert_sales" on public.sales;
create policy "auth_insert_sales" on public.sales for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "auth_insert_sale_items" on public.sale_items;
create policy "auth_insert_sale_items" on public.sale_items for insert to authenticated with check (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run separately in Supabase dashboard or via API:
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
-- create policy "Auth upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
-- create policy "Auth delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================
create or replace view public.v_sales_today as
  select
    coalesce(sum(total), 0) as revenue,
    count(*) as count
  from public.sales
  where created_at::date = current_date;

create or replace view public.v_best_products as
  select
    p.id,
    p.name,
    p.image_url,
    c.name as category,
    sum(si.quantity) as total_sold,
    sum(si.subtotal) as total_revenue
  from public.sale_items si
  join public.products p on p.id = si.product_id
  left join public.categories c on c.id = p.category_id
  group by p.id, p.name, p.image_url, c.name
  order by total_sold desc;

create or replace view public.v_daily_revenue as
  select
    created_at::date as day,
    count(*) as sales_count,
    sum(total) as revenue
  from public.sales
  group by day
  order by day desc;

create or replace view public.v_low_stock as
  select id, name, stock_quantity, image_url
  from public.products
  where stock_quantity <= 3
  order by stock_quantity asc;
