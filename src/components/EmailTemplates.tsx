import { Bold, Layout } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  content: string;
  thumbnail: string;
}

export const emailTemplates: Template[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Welcome+Template',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**Welcome to Our Community! 👋**'
      },
      {
        id: 'intro',
        type: 'text',
        content: "We're thrilled to have you on board! Here's what you can expect from us:"
      },
      {
        id: 'benefits',
        type: 'text',
        content: '• Weekly newsletters with industry insights\n• Exclusive member discounts\n• Early access to new features\n• Community events and webinars'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'Get Started',
        url: '#'
      }
    ])
  },
  {
    id: 'monthly-newsletter',
    name: 'Monthly Newsletter',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Newsletter+Template',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**Monthly Highlights - [Month] [Year]**'
      },
      {
        id: 'featured-image',
        type: 'image',
        content: ''
      },
      {
        id: 'intro',
        type: 'text',
        content: '**Top Stories This Month**\n\n1. [Headline One]\n2. [Headline Two]\n3. [Headline Three]'
      },
      {
        id: 'main-story',
        type: 'text',
        content: '**Featured Story**\n\nYour main story content goes here...'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'Read More',
        url: '#'
      }
    ])
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Product+Launch',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**Introducing Our Latest Product 🚀**'
      },
      {
        id: 'product-image',
        type: 'image',
        content: ''
      },
      {
        id: 'description',
        type: 'text',
        content: '**Transform Your Experience**\n\nDiscover how our new product can revolutionize your workflow...'
      },
      {
        id: 'features',
        type: 'text',
        content: '**Key Features:**\n\n✨ Feature One\n🎯 Feature Two\n⚡ Feature Three'
      },
      {
        id: 'pricing',
        type: 'text',
        content: '**Special Launch Offer**\n\nGet 20% off during our launch week!'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'Shop Now',
        url: '#'
      }
    ])
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Event+Template',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**You\'re Invited! 🎉**'
      },
      {
        id: 'event-banner',
        type: 'image',
        content: ''
      },
      {
        id: 'details',
        type: 'text',
        content: '**Event Details**\n\n📅 Date: [Date]\n⏰ Time: [Time]\n📍 Location: [Location]'
      },
      {
        id: 'description',
        type: 'text',
        content: 'Join us for an exciting event filled with...'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'RSVP Now',
        url: '#'
      }
    ])
  },
  {
    id: 'feedback-survey',
    name: 'Feedback Survey',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Feedback+Template',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**We Value Your Feedback! 📝**'
      },
      {
        id: 'message',
        type: 'text',
        content: 'Your opinion helps us improve our services. Please take a moment to share your thoughts.'
      },
      {
        id: 'time-estimate',
        type: 'text',
        content: '⏱️ _This survey takes approximately 5 minutes to complete._'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'Take Survey',
        url: '#'
      }
    ])
  },
  {
    id: 'promotional',
    name: 'Special Offer',
    thumbnail: 'https://placehold.co/600x400/e2e8f0/475569?text=Promo+Template',
    content: JSON.stringify([
      {
        id: 'header',
        type: 'text',
        content: '**Limited Time Offer! ⏰**'
      },
      {
        id: 'promo-image',
        type: 'image',
        content: ''
      },
      {
        id: 'offer',
        type: 'text',
        content: '**SAVE 30%**\n\nUse code: **SPECIAL30**'
      },
      {
        id: 'terms',
        type: 'text',
        content: '_Offer valid until [Date]. Terms and conditions apply._'
      },
      {
        id: 'cta',
        type: 'button',
        content: 'Shop Now',
        url: '#'
      }
    ])
  }
];

interface TemplatePickerProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
          <div className="sticky top-0 bg-white pb-4 mb-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <Bold className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition-colors"
                onClick={() => onSelect(template)}
              >
                <div className="aspect-video bg-gray-100 rounded-md mb-3 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Template';
                    }}
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 