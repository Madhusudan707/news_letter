const MAILBUSTER_API_KEY = import.meta.env.VITE_MAILBUSTER_API_KEY;
const MAILBUSTER_API_URL = 'https://api.mailbluster.com';
const SENDER_EMAIL = 'madhusudan707@gmail.com';

interface MailBusterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendCampaign(campaign: {
  name: string;
  subject: string;
  content: string;
  recipientList?: string[];
}): Promise<MailBusterResponse> {
  try {
    console.log('Sending campaign:', campaign);

    // Send to each recipient individually
    const sendPromises = campaign.recipientList?.map(async (email) => {
      const response = await fetch(`${MAILBUSTER_API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          "authorization": MAILBUSTER_API_KEY,
          "email": email,
          "firstName": "",
          "lastName": "",
          "timezone": "UTC",
          "subscribed": true,
          "tags": ["campaign_" + campaign.name.toLowerCase().replace(/\s+/g, '_')],
          "metadata": {
            "campaign_name": campaign.name,
            "subject": campaign.subject,
            "content": campaign.content,
            "sender_email": SENDER_EMAIL
          },
          "from_email": SENDER_EMAIL,
          "from_name": "Madhusudan"
        })
      });

      return response;
    });

    if (!sendPromises) {
      return {
        success: false,
        error: 'No recipients specified'
      };
    }

    const responses = await Promise.all(sendPromises);
    const allSuccessful = responses.every(response => response.ok);

    if (!allSuccessful) {
      return {
        success: false,
        error: 'Failed to send to some recipients'
      };
    }

    return { success: true, data: { sent: responses.length } };
  } catch (error) {
    console.error('Send campaign error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send campaign'
    };
  }
}

export async function getSubscribers(): Promise<MailBusterResponse> {
  try {
    const response = await fetch(`${MAILBUSTER_API_URL}/subscribers`, {
      headers: {
        'Authorization': `Bearer ${MAILBUSTER_API_KEY}`
      }
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscribers'
    };
  }
}

export async function addSubscriber(email: string, metadata?: Record<string, any>): Promise<MailBusterResponse> {
  try {
    const response = await fetch(`${MAILBUSTER_API_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({
        "authorization": MAILBUSTER_API_KEY,
        "email": email,
        "firstName": metadata?.firstName || "",
        "lastName": metadata?.lastName || "",
        "timezone": "UTC",
        "subscribed": true,
        "metadata": metadata
      })
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add subscriber'
    };
  }
}

export async function getCampaignStats(campaignId: string): Promise<MailBusterResponse> {
  try {
    const response = await fetch(`${MAILBUSTER_API_URL}/campaigns/${campaignId}/stats`, {
      headers: {
        'Authorization': `Bearer ${MAILBUSTER_API_KEY}`
      }
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaign stats'
    };
  }
} 