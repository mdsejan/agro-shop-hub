create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

-- first signed-up user becomes admin
create or replace function public.handle_new_user_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users for each row execute function public.handle_new_user_role();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  category text not null default 'General',
  description text,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read products" on public.products for select to anon, authenticated using (true);
create policy "admin insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update products" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  phone text not null check (char_length(phone) between 5 and 20),
  address text not null check (char_length(address) between 5 and 500),
  product_name text not null default '',
  quantity int not null check (quantity between 1 and 1000),
  total_price numeric(12,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "anyone can place order" on public.orders for insert to anon, authenticated with check (status = 'pending');
create policy "admin read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- compute product name & total server-side
create or replace function public.orders_fill_totals() returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select name, price into p from public.products where id = new.product_id;
  if not found then raise exception 'Invalid product'; end if;
  new.product_name := p.name;
  new.total_price := p.price * new.quantity;
  new.status := 'pending';
  new.created_at := now();
  return new;
end $$;
create trigger orders_fill_totals before insert on public.orders for each row execute function public.orders_fill_totals();

insert into public.products (name, price, image_url, category, description) values
('Hybrid Tomato Seeds (100g)', 450, 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800', 'Seeds', 'High-yield, disease-resistant hybrid tomato seeds for all seasons.'),
('Organic Vermicompost (25kg)', 750, 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800', 'Fertilizer', 'Nutrient-rich organic compost that improves soil health naturally.'),
('Steel Garden Hoe', 620, 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=800', 'Tools', 'Forged steel hoe with ash-wood handle for weeding and tilling.'),
('Knapsack Sprayer 16L', 2350, 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', 'Equipment', 'Manual pressure sprayer for pesticides and liquid fertilizer.'),
('Drip Irrigation Kit', 3200, 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800', 'Irrigation', 'Water-saving drip kit covering up to 50 square meters.'),
('Pruning Shears', 380, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', 'Tools', 'Sharp bypass pruners with ergonomic non-slip grip.'),
('Chili Pepper Seeds (50g)', 290, 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=800', 'Seeds', 'Hot local chili variety with strong germination rate.'),
('NPK Fertilizer 20-20-20 (5kg)', 980, 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800', 'Fertilizer', 'Balanced water-soluble fertilizer for faster crop growth.');