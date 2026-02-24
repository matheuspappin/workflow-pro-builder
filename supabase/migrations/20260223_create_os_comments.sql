create table if not exists service_order_comments (
  id uuid default gen_random_uuid() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz default now(),
  studio_id uuid references studios(id) on delete cascade not null
);

-- RLS
alter table service_order_comments enable row level security;

create policy "Enable read access for users in the same studio"
  on service_order_comments for select
  using (true);

create policy "Enable insert for authenticated users"
  on service_order_comments for insert
  with check (auth.role() = 'authenticated');
