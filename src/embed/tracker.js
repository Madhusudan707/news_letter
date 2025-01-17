(function(window, document) {
  // Configuration
  const TRACKER_URL = 'https://freemail0.netlify.app/';
  const SCRIPT_ID = 'newsletter-tracker';
  
  // Valid event types
  const VALID_EVENTS = {
    page_view: true,
    form_submit: true,
    click: true,
    scroll: true,
    custom: true,
    form_interaction: true,
    content_interaction: true,
    subscription: true
  };

  // Event validation function
  function validateEvent(data) {
    if (!data.type || !VALID_EVENTS[data.type]) {
      console.error('Invalid event type:', data.type);
      return false;
    }

    if (!data.clientId) {
      console.error('Missing client ID');
      return false;
    }

    if (!data.timestamp) {
      console.error('Missing timestamp');
      return false;
    }

    return true;
  }

  // Initialize tracker
  window.NewsletterTracker = window.NewsletterTracker || {
    init: function(clientId) {
      this.clientId = clientId;
      this.setup();
    },

    setup: function() {
      // Track page views
      this.trackPageView();
      
      // Track clicks
      document.addEventListener('click', this.handleClick.bind(this));
      
      // Track form submissions
      this.setupFormTracking();
    },

    trackPageView: function() {
      const data = {
        clientId: this.clientId,
        type: 'pageview',
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString()
      };

      this.sendData(data);
    },

    handleClick: function(e) {
      const target = e.target;
      
      // Track newsletter form interactions
      if (target.closest('[data-newsletter-form]')) {
        this.trackFormInteraction(target);
      }

      // Track content interactions
      if (target.closest('[data-content-id]')) {
        this.trackContentInteraction(target);
      }
    },

    trackFormInteraction: function(element) {
      const form = element.closest('[data-newsletter-form]');
      const data = {
        clientId: this.clientId,
        type: 'form_interaction',
        formId: form.getAttribute('data-newsletter-form'),
        element: element.tagName,
        action: element.type || 'click',
        timestamp: new Date().toISOString()
      };

      this.sendData(data);
    },

    trackContentInteraction: function(element) {
      const content = element.closest('[data-content-id]');
      const data = {
        clientId: this.clientId,
        type: 'content_interaction',
        contentId: content.getAttribute('data-content-id'),
        contentType: content.getAttribute('data-content-type') || 'unknown',
        timestamp: new Date().toISOString()
      };

      this.sendData(data);
    },

    setupFormTracking: function() {
      document.querySelectorAll('[data-newsletter-form]').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const email = form.querySelector('input[type="email"]').value;
          const data = {
            clientId: this.clientId,
            type: 'subscription',
            email: email,
            formId: form.getAttribute('data-newsletter-form'),
            timestamp: new Date().toISOString()
          };

          this.sendData(data);
        });
      });
    },

    sendData: async function(data) {
      try {
        if (!validateEvent(data)) {
          throw new Error('Invalid event data');
        }

        const response = await fetch(TRACKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: this.clientId,
            type: data.type,
            url: window.location.href,
            ...data
          }),
          credentials: 'include' // Include cookies if needed
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`Event tracked: ${data.type}`);
      } catch (error) {
        console.error('Tracking error:', error);
      }
    }
  };

  window.NewsletterTracker('track', {
    event_type: 'page_view',
    page_url: window.location.href,
    data: {
      title: document.title,
      referrer: document.referrer
    }
  });
})(window, document); 