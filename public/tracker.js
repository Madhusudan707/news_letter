(function(window, document) {
  // Configuration
  const TRACKER_URL = 'https://freemail0.netlify.app/';
  const DEBUG = true;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getVisitCount() {
    let visits = parseInt(localStorage.getItem('nlt_visit_count') || '0');
    visits++;
    localStorage.setItem('nlt_visit_count', visits.toString());
    return visits;
  }

  function getLastVisit() {
    return localStorage.getItem('nlt_last_visit');
  }

  function updateLastVisit() {
    const now = new Date().toISOString();
    localStorage.setItem('nlt_last_visit', now);
    return now;
  }

  function getAnonymousId() {
    const storageKey = 'nlt_anonymous_id';
    let anonymousId = localStorage.getItem(storageKey);
    
    if (!anonymousId) {
      anonymousId = 'anon_' + generateUUID();
      localStorage.setItem(storageKey, anonymousId);
    }

    return {
      id: anonymousId,
      isReturning: !!localStorage.getItem('nlt_last_visit'),
      visitCount: getVisitCount(),
      lastVisit: getLastVisit()
    };
  }

  window.NewsletterTracker = {
    clientId: null,
    anonymousData: getAnonymousId(),
    pageStartTime: Date.now(),

    sendEvent: async function(type, eventData) {
      try {
        const data = {
          clientId: this.clientId,
          anonymousId: this.anonymousData.id,
          isReturning: this.anonymousData.isReturning,
          visitCount: this.anonymousData.visitCount,
          lastVisit: this.anonymousData.lastVisit,
          type: type,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...eventData
        };

        if (DEBUG) console.log('[Tracker]', type, data);

        const response = await fetch(TRACKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // Update last visit after successful tracking
        updateLastVisit();
      } catch (error) {
        console.error('Tracking error:', error);
      }
    }
  };

  // Start tracking with returning user data
  window.NewsletterTracker.sendEvent('page_view', {
    isNewSession: !window.NewsletterTracker.anonymousData.lastVisit,
    sessionCount: window.NewsletterTracker.anonymousData.visitCount
  });

})(window, document); 