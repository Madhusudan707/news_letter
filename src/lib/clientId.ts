import { supabase } from './supabase';
import { nanoid } from 'nanoid';
import { useAuth } from './auth';

interface ClientConfig {
  website: string;
  name: string;
  email: string;
}

export async function generateClientId(config: ClientConfig) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const clientId = `nlt_${nanoid(16)}`;
  const apiKey = `key_${nanoid(32)}`;

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        client_id: clientId,
        api_key: apiKey,
        website: config.website,
        name: config.name,
        email: config.email,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      clientId: data.client_id,
      apiKey: data.api_key
    };
  } catch (error) {
    console.error('Error generating client ID:', error);
    throw error;
  }
}

export async function validateClientId(clientId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('status')
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.status === 'active';
} 