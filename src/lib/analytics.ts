import { supabase } from './supabase';

export async function trackEmailOpen(subscriberId: string, campaignId: string) {
  const { error } = await supabase
    .from('engagement_metrics')
    .insert([{
      subscriber_id: subscriberId,
      campaign_id: campaignId,
      event_type: 'email_open',
      timestamp: new Date().toISOString()
    }]);

  if (error) console.error('Error tracking email open:', error);
}

export async function trackLinkClick(subscriberId: string, campaignId: string, url: string) {
  const { error } = await supabase
    .from('engagement_metrics')
    .insert([{
      subscriber_id: subscriberId,
      campaign_id: campaignId,
      event_type: 'link_click',
      metadata: { url },
      timestamp: new Date().toISOString()
    }]);

  if (error) console.error('Error tracking link click:', error);
}

export async function updateSubscriberActivity(subscriberId: string) {
  const { error } = await supabase
    .from('subscribers')
    .update({ last_active: new Date().toISOString() })
    .eq('id', subscriberId);

  if (error) console.error('Error updating subscriber activity:', error);
} 