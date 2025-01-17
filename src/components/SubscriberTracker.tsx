import { useEffect } from 'react';
import { trackSubscriberActivity } from '../lib/segmentation';

interface SubscriberTrackerProps {
  subscriberId: string;
}

export function SubscriberTracker({ subscriberId }: SubscriberTrackerProps) {
  useEffect(() => {
    // Track page views
    const trackPageView = () => {
      trackSubscriberActivity(subscriberId, {
        page_view: window.location.pathname
      });
    };

    // Track content interactions
    const trackContentInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const contentElement = target.closest('[data-content-id]');
      
      if (contentElement) {
        trackSubscriberActivity(subscriberId, {
          content_interaction: contentElement.getAttribute('data-content-id')
        });
      }
    };

    // Initialize tracking
    trackPageView();
    document.addEventListener('click', trackContentInteraction);

    // Cleanup
    return () => {
      document.removeEventListener('click', trackContentInteraction);
    };
  }, [subscriberId]);

  return null; // This is a non-visual component
} 