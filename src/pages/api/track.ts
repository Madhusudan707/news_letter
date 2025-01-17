import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, type, ...eventData } = req.body;

    // Validate request
    if (!clientId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from('tracking_events')
      .insert({
        client_id: clientId,
        event_type: type,
        page_url: eventData.url,
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        data: eventData,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    return res.status(500).json({ error: 'Failed to store tracking data' });
  }
} 