import { useClient } from '../lib/clientContext';

export function ClientSelector() {
  const { clients, selectedClient, setSelectedClient, isLoading } = useClient();

  if (isLoading || clients.length === 0) return null;

  return (
    <select
      value={selectedClient?.id || ''}
      onChange={(e) => {
        const client = clients.find(c => c.id === e.target.value);
        setSelectedClient(client || null);
      }}
      className="ml-4 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      {clients.map(client => (
        <option key={client.id} value={client.id}>
          {client.name || client.client_id}
        </option>
      ))}
    </select>
  );
} 