import { supabase } from './supabase';

interface UserActivity {
  subscriberId: string;
  pageView?: {
    path: string;
    duration: number;
    timestamp: Date;
  };
  click?: {
    element: string;
    context: string;
    timestamp: Date;
  };
  interest?: string;
  device?: {
    type: string;
    browser: string;
    os: string;
  };
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
}

export class UserTracker {
  private activities: UserActivity[] = [];
  private sessionStartTime: Date;
  
  constructor(private subscriberId: string) {
    this.sessionStartTime = new Date();
    this.initializeTracking();
  }

  private initializeTracking() {
    // Track page views
    this.trackPageView();
    
    // Track clicks
    this.trackClicks();
    
    // Track device info
    this.collectDeviceInfo();
    
    // Track location (with user permission)
    this.collectLocationInfo();
    
    // Track session duration
    window.addEventListener('beforeunload', () => {
      this.recordSessionDuration();
    });
  }

  private async trackPageView() {
    const path = window.location.pathname;
    // Identify content category/topic from the path
    const topic = this.identifyContentTopic(path);
    
    await this.updateSubscriberInterests(topic);
    
    await supabase.from('page_views').insert({
      subscriber_id: this.subscriberId,
      path,
      topic,
      timestamp: new Date()
    });
  }

  private async trackClicks() {
    document.addEventListener('click', async (e) => {
      const element = e.target as HTMLElement;
      const context = this.getClickContext(element);
      
      await supabase.from('click_events').insert({
        subscriber_id: this.subscriberId,
        element: element.tagName,
        context,
        timestamp: new Date()
      });
    });
  }

  private async updateSubscriberInterests(topic: string) {
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('behavioral_data')
      .eq('id', this.subscriberId)
      .single();

    const interests = new Set(subscriber?.behavioral_data?.interests || []);
    interests.add(topic);

    await supabase
      .from('subscribers')
      .update({
        behavioral_data: {
          ...subscriber?.behavioral_data,
          interests: Array.from(interests)
        }
      })
      .eq('id', this.subscriberId);
  }

  private identifyContentTopic(path: string): string {
    // Implement logic to identify content topic from URL path
    // Example: /blog/health-tips -> 'health'
    const segments = path.split('/').filter(Boolean);
    return segments[1]?.split('-')[0] || 'general';
  }

  private getClickContext(element: HTMLElement): string {
    // Analyze clicked element and its parents to determine context
    let context = '';
    if (element.closest('nav')) context = 'navigation';
    else if (element.closest('article')) context = 'content';
    else if (element.closest('button')) context = 'action';
    return context;
  }

  private async collectDeviceInfo() {
    const userAgent = navigator.userAgent;
    const deviceInfo = {
      type: this.getDeviceType(userAgent),
      browser: this.getBrowserInfo(userAgent),
      os: this.getOperatingSystem(userAgent)
    };

    await supabase
      .from('subscribers')
      .update({
        device_data: deviceInfo
      })
      .eq('id', this.subscriberId);
  }

  private async collectLocationInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      await supabase
        .from('subscribers')
        .update({
          geographic_data: {
            country: data.country_name,
            city: data.city,
            timezone: data.timezone
          }
        })
        .eq('id', this.subscriberId);
    } catch (error) {
      console.error('Error collecting location data:', error);
    }
  }

  private async recordSessionDuration() {
    const duration = new Date().getTime() - this.sessionStartTime.getTime();
    
    await supabase.from('sessions').insert({
      subscriber_id: this.subscriberId,
      duration,
      start_time: this.sessionStartTime,
      end_time: new Date()
    });
  }
}

export function getCurrentSubscriberId(): string | null {
  return localStorage.getItem('subscriber_id');
}

export function setCurrentSubscriberId(id: string): void {
  localStorage.setItem('subscriber_id', id);
}