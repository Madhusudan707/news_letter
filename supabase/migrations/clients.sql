create table clients (
  id bigint primary key generated always as identity,
  client_id text unique not null,
  api_key text unique not null,
  domain text not null,
  name text not null,
  email text not null,
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  settings jsonb default '{}'::jsonb,
  constraint status_check check (status in ('active', 'inactive', 'suspended'))
);

-- Create index for faster lookups
create index idx_clients_client_id on clients(client_id);
create index idx_clients_api_key on clients(api_key);

-- Add trigger for updating updated_at
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
  before update on clients
  for each row
  execute procedure trigger_set_timestamp(); 