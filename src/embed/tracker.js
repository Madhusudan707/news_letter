(function(window, document) {
  // Configuration
  const TRACKER_URL = 'https://freemail0.netlify.app/';
  const SCRIPT_ID = 'newsletter-tracker';

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
        const response = await fetch(`${TRACKER_URL}/api/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to send tracking data');
      } catch (error) {
        console.error('Tracking error:', error);
      }
    }
  };
})(window, document); 