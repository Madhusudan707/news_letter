-- Drop existing table if it exists
drop table if exists public.clients cascade;

-- Create clients table
create table public.clients (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade not null,
    client_id text not null,
    api_key text not null,
    name text,  -- Name for this client instance
    email text not null,  -- Added email field
    email_id text not null,  -- Added email_id field
    company_name text,
    website text,
    status text default 'active' check (status in ('active', 'inactive', 'suspended')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure client_id is unique per user
    unique(user_id, client_id),
    -- Ensure api_key is globally unique
    unique(api_key),
    -- Ensure email_id is unique per user
    unique(user_id, email_id)
);

-- Enable RLS
alter table public.clients enable row level security;

-- Drop existing policies if any
drop policy if exists "Enable read access for authenticated users" on clients;
drop policy if exists "Enable insert access for authenticated users" on clients;
drop policy if exists "Enable update access for authenticated users" on clients;
drop policy if exists "Enable delete access for authenticated users" on clients;

-- Create policies with proper authentication checks
create policy "Allow public read for client_id check"
    on clients for select
    using (true);  -- Allow public read access for client_id uniqueness check

create policy "Enable insert access for authenticated users"
    on clients for insert
    with check (
        auth.role() = 'authenticated' 
        and auth.uid() = user_id
    );

create policy "Enable update access for own clients"
    on clients for update
    using (
        auth.role() = 'authenticated' 
        and auth.uid() = user_id
    );

create policy "Enable delete access for own clients"
    on clients for delete
    using (
        auth.role() = 'authenticated' 
        and auth.uid() = user_id
    );

-- Create indexes
create index clients_user_id_idx on clients(user_id);
create index clients_client_id_idx on clients(client_id);
create index clients_email_idx on clients(email);
create index clients_email_id_idx on clients(email_id); 