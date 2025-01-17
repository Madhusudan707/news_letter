-- Add unique constraint to existing clients table
ALTER TABLE clients 
ADD CONSTRAINT clients_client_id_key UNIQUE (client_id);

-- Now create tracking_events table
create table tracking_events (
  id uuid default uuid_generate_v4() primary key,
  client_id text not null references clients(client_id),
  event_type text not null,
  page_url text,
  user_agent text,
  ip_address text,
  data jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  constraint valid_event_type check (event_type in (
    'page_view',
    'form_submit',
    'click',
    'scroll',
    'custom'
  ))
);

-- Create indexes
create index idx_tracking_events_client_id on tracking_events(client_id);
create index idx_tracking_events_created_at on tracking_events(created_at); 