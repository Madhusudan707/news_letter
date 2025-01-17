import { supabase } from './supabase';
import { nanoid } from 'nanoid';

interface ClientConfig {
  domain: string;
  name: string;
  email: string;
}

export async function generateClientId(config: ClientConfig) {
  // Generate a unique client ID
  const clientId = `nlt_${nanoid(16)}`; // 'nlt' prefix for 'newsletter tracker'
  
  try {
    // Store client information in the database
    const { data, error } = await supabase
      .from('clients')
      .insert({
        client_id: clientId,
        domain: config.domain,
        name: config.name,
        email: config.email,
        status: 'active',
        created_at: new Date().toISOString(),
        api_key: `key_${nanoid(32)}` // Generate API key for client
      })
      .select()
      .single();

    if (error) throw error;

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