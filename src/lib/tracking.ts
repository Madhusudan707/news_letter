import { supabase } from './supabase';

export async function trackEvent(eventData: {
  client_id: string;
  event_type: 'page_view' | 'form_submit' | 'click' | 'scroll' | 'custom';
  page_url?: string;
  data?: any;
}) {
  try {
    const { error } = await supabase
      .from('tracking_events')
      .insert({
        ...eventData,
        user_agent: navigator.userAgent,
        ip_address: await fetchIpAddress(),
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Tracking error:', error);
    return false;
  }
}

async function fetchIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

export function getCurrentSubscriberId(): string | null {
  return localStorage.getItem('subscriber_id');
}