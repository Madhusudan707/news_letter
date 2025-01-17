import { supabase } from './supabase';

export interface SegmentCriteria {
  demographic?: {
    age_groups?: string[];
    gender?: string[];
    income_range?: string[];
    education_level?: string[];
    occupation?: string[];
    marital_status?: string[];
  };
  geographic?: {
    country?: string[];
    city?: string[];
    region?: string[];
    timezone?: string[];
    language?: string[];
  };
  psychographic?: {
    interests?: string[];
    lifestyle?: string[];
    values?: string[];
    personality_traits?: string[];
    social_class?: string[];
  };
  behavioral?: {
    usage_rate?: string[];
    brand_loyalty?: string[];
    benefits_sought?: string[];
    readiness_stage?: string[];
    occasions?: string[];
  };
  lifecycle?: {
    stage?: string[];
    customer_status?: string[];
    acquisition_source?: string[];
    membership_duration?: string[];
  };
  purchase_history?: {
    frequency?: string[];
    recency?: number; // days since last purchase
    average_order_value?: number[];
    product_categories?: string[];
    total_spent_range?: string[];
  };
  email_engagement?: {
    open_rate?: number;
    click_rate?: number;
    last_opened?: number; // days ago
    subscription_duration?: number;
    engagement_level?: string[];
  };
}

export async function getSegmentedSubscribers(criteria: SegmentCriteria) {
  let query = supabase
    .from('subscribers')
    .select('*')
    .eq('subscribed', true);

  if (criteria.email_engagement) {
    if (criteria.email_engagement.engagement_level) {
      query = query.gte(
        'tracking_data->engagement_score',
        getMinEngagementScore(criteria.email_engagement.engagement_level)
      );
    }
    
    if (criteria.email_engagement.last_opened) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.email_engagement.last_opened);
      query = query.gte('last_activity', cutoffDate.toISOString());
    }
  }

  if (criteria.behavioral?.interests) {
    query = query.contains('tracking_data->interests', criteria.behavioral.interests);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching segmented subscribers:', error);
    return [];
  }

  return data;
}

export function calculateSegmentSize(subscribers: any[], criteria: SegmentCriteria): number {
  return subscribers.filter(subscriber => {
    let matches = true;
    
    // Check demographics
    if (criteria.demographic) {
      const demo = subscriber.demographic || {};
      
      if (criteria.demographic.age_groups?.length) {
        matches = matches && criteria.demographic.age_groups.includes(demo.age_group);
      }
      
      if (criteria.demographic.gender?.length) {
        matches = matches && criteria.demographic.gender.includes(demo.gender);
      }
      
      if (criteria.demographic.income_range?.length) {
        matches = matches && criteria.demographic.income_range.includes(demo.income_range);
      }
      
      if (criteria.demographic.education_level?.length) {
        matches = matches && criteria.demographic.education_level.includes(demo.education_level);
      }
      
      if (criteria.demographic.occupation?.length) {
        matches = matches && criteria.demographic.occupation.includes(demo.occupation);
      }
      
      if (criteria.demographic.marital_status?.length) {
        matches = matches && criteria.demographic.marital_status.includes(demo.marital_status);
      }
    }
    
    return matches;
  }).length;
}

export async function trackSubscriberActivity(subscriberId: string, activity: {
  page_view?: string;
  content_interaction?: string;
  email_interaction?: {
    email_id: string;
    action: 'open' | 'click';
  };
}) {
  const timestamp = new Date().toISOString();

  // Get existing tracking data
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('tracking_data')
    .eq('id', subscriberId)
    .single();

  const trackingData = subscriber?.tracking_data || {
    page_views: [],
    content_interactions: [],
    email_interactions: [],
    interests: [],
    engagement_score: 0
  };

  // Update tracking data based on activity type
  if (activity.page_view) {
    trackingData.page_views.push({
      path: activity.page_view,
      timestamp
    });
  }

  if (activity.content_interaction) {
    trackingData.content_interactions.push({
      content: activity.content_interaction,
      timestamp
    });
  }

  if (activity.email_interaction) {
    trackingData.email_interactions.push({
      ...activity.email_interaction,
      timestamp
    });
  }

  // Update engagement score and interests
  trackingData.engagement_score = calculateEngagementScore(trackingData);
  trackingData.interests = inferInterests(trackingData);

  // Update subscriber record
  await supabase
    .from('subscribers')
    .update({
      tracking_data: trackingData,
      last_activity: timestamp
    })
    .eq('id', subscriberId);
}

// Helper functions
function calculateEngagementScore(trackingData: any): number {
  const pageViewScore = trackingData.page_views.length * 1;
  const contentScore = trackingData.content_interactions.length * 2;
  const emailScore = trackingData.email_interactions.length * 3;
  
  return pageViewScore + contentScore + emailScore;
}

function inferInterests(trackingData: any): string[] {
  const interestCounts = {};
  
  // Analyze page views
  trackingData.page_views.forEach(view => {
    const topic = extractTopicFromPath(view.path);
    interestCounts[topic] = (interestCounts[topic] || 0) + 1;
  });

  // Analyze content interactions
  trackingData.content_interactions.forEach(interaction => {
    const topic = extractTopicFromContent(interaction.content);
    interestCounts[topic] = (interestCounts[topic] || 0) + 2;
  });

  // Return top 5 interests
  return Object.entries(interestCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([topic]) => topic);
}

function getMinEngagementScore(level: string): number {
  const thresholds = {
    high: 50,
    medium: 20,
    low: 0
  };
  return thresholds[level] || 0;
}

function extractTopicFromPath(path: string): string {
  // Implement logic to extract topic from URL path
  // Example: /blog/health-tips -> 'health'
  const segments = path.split('/').filter(Boolean);
  return segments[1]?.split('-')[0] || 'general';
}

function extractTopicFromContent(content: string): string {
  // Implement logic to extract topic from content interaction
  // This would depend on your content structure
  return content.split('-')[0] || 'general';
} 