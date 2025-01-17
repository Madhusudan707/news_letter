import { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { EmbedCodeGenerator } from '../components/EmbedCodeGenerator';
import { ClientRegistration } from '../components/ClientRegistration';

interface ClientSettings {
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

interface Profile {
  full_name: string;
  email: string;
  avatar_url?: string;
  company_name?: string;
  website?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSettings[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<'apiKey' | 'clientId' | 'embed' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientRegistration, setShowClientRegistration] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchClientSettings(),
        fetchProfile()
      ]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error('Profiles table not found');
        return;
      }
      // Create profile if it doesn't exist
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return;
        }
        setProfile(newProfile);
        return;
      }
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
  };

  const fetchClientSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        console.error('Clients table not found');
        return;
      }
      console.error('Error fetching client settings:', error);
      return;
    }

    setClients(data || []);
    if (data && data.length > 0) {
      setSelectedClient(data[0]); // Select the first client by default
    }
  };

  const copyToClipboard = async (text: string, type: 'apiKey' | 'clientId' | 'embed') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          website: profile.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Profile Section */}
        {profile && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile?.full_name || ''}
                    onChange={e => setProfile(prev => ({ ...prev!, full_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profile?.company_name || ''}
                    onChange={e => setProfile(prev => ({ ...prev!, company_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile?.website || ''}
                    onChange={e => setProfile(prev => ({ ...prev!, website: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{profile?.full_name}</h3>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                </div>
                {profile?.company_name && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Company:</span> {profile.company_name}
                  </div>
                )}
                {profile?.website && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Website:</span>{' '}
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Client Selector */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Client Settings</h2>
            <button
              onClick={() => setShowClientRegistration(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Add New Client
            </button>
          </div>
          {clients.length > 0 ? (
            <select
              value={selectedClient?.id}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value);
                setSelectedClient(client || null);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name || client.client_id} {client.company_name ? `(${client.company_name})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">No clients found. Add your first client to get started.</p>
          )}
        </div>

        {/* Client Registration Modal */}
        {showClientRegistration && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <ClientRegistration />
              <button
                onClick={() => setShowClientRegistration(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Selected Client Information */}
        {selectedClient && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
            
            {/* Client ID */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-gray-50 rounded-md font-mono text-sm">
                  {selectedClient.client_id}
                </code>
                <button
                  onClick={() => copyToClipboard(selectedClient.client_id, 'clientId')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              {copied === 'clientId' && (
                <span className="text-sm text-green-600">Copied!</span>
              )}
            </div>

            {/* API Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-gray-50 rounded-md font-mono text-sm">
                  {showApiKey ? selectedClient.api_key : '•'.repeat(40)}
                </code>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(selectedClient.api_key, 'apiKey')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              {copied === 'apiKey' && (
                <span className="text-sm text-green-600">Copied!</span>
              )}
            </div>
          </div>
        )}

        {/* Embed Code Section */}
        {selectedClient && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Embed Code</h2>
            <EmbedCodeGenerator 
              clientId={selectedClient.client_id} 
              onCopy={() => setCopied('embed')}
              copied={copied === 'embed'}
            />
          </div>
        )}
      </div>
    </div>
  );
} 