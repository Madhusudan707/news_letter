import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

export interface ClientSettings {
  id: string;
  client_id: string;
  api_key: string;
  name: string;
  email: string;
  company_name?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

interface ClientContextType {
  clients: ClientSettings[];
  selectedClient: ClientSettings | null;
  setSelectedClient: (client: ClientSettings | null) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSettings[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      if (!user) return;

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClients(data);
        if (data.length > 0) {
          setSelectedClient(data[0]);
        }
      }
      setIsLoading(false);
    }

    fetchClients();
  }, [user]);

  return (
    <ClientContext.Provider value={{ clients, selectedClient, setSelectedClient, isLoading }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
