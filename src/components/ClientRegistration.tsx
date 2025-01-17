import { useState } from 'react';
import { generateClientId } from '../lib/clientId';

export function ClientRegistration() {
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    clientId: string;
    apiKey: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await generateClientId({
        domain: formData.get('domain') as string,
        name: formData.get('name') as string,
        email: formData.get('email') as string
      });

      setClientInfo(result);
    } catch (error) {
      console.error('Error registering client:', error);
      alert('Failed to generate client ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {!clientInfo ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website Domain
            </label>
            <input
              type="text"
              name="domain"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Generating...' : 'Generate Client ID'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4">
            <h3 className="text-sm font-medium text-green-800">
              Registration Successful!
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Client ID: {clientInfo.clientId}</p>
              <p className="mt-1">API Key: {clientInfo.apiKey}</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Please save these credentials securely. You'll need them to:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Initialize the tracking script</li>
              <li>Access the API</li>
              <li>View analytics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 