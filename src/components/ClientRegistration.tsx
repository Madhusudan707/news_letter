import { useState } from 'react';
import { generateClientId } from '../lib/clientId';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';

export function ClientRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{
    clientId: string;
    apiKey: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      console.log('Submitting registration with data:', {
        website: formData.get('website'),
        name: formData.get('name'),
        email: formData.get('email')
      });

      const result = await generateClientId({
        website: formData.get('website') as string,
        name: formData.get('name') as string,
        email: formData.get('email') as string
      });

      console.log('Registration result:', result);
      setClientInfo(result);
    } catch (error) {
      console.error('Error in registration:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate client ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!clientInfo ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="text"
              name="website"
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
          
          <EmbedCodeGenerator 
            clientId={clientInfo.clientId} 
            onCopy={() => {}}
            copied={false}
          />
        </div>
      )}
    </div>
  );
} 