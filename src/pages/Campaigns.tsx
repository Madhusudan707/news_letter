import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Send, X, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import EmailBuilder from '../components/EmailBuilder';
import { TemplatePicker, Template } from '../components/EmailTemplates';
import { sendCampaign } from '../lib/mailbuster';
import { SegmentationBuilder } from '../components/SegmentationBuilder';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  recipients: string[];
}

interface NewCampaign {
  name: string;
  subject: string;
  content: string;
  recipients: string[];
}

interface SendCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSend: () => void;
}

interface PendingImage {
  id: string;
  file: File;
}

function CampaignModal({ 
  isOpen, 
  onClose, 
  initialData = { name: '', subject: '', content: '', recipients: [] },
  onSubmit,
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  initialData?: NewCampaign;
  onSubmit: (campaign: NewCampaign) => void;
  title: string;
}) {
  const [campaign, setCampaign] = useState<NewCampaign>(initialData);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [subscribers, setSubscribers] = useState<Array<{ email: string; subscribed: boolean }>>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>(
    initialData?.recipients || []
  );
  const [loading, setLoading] = useState(false);
  const emailBuilderRef = useRef<{ getPendingImages: () => PendingImage[] }>(null);
  const [segmentedSubscribers, setSegmentedSubscribers] = useState<any[]>([]);
  const [showSegmentation, setShowSegmentation] = useState(false);

  useEffect(() => {
    if (initialData?.recipients) {
      setSelectedSubscribers(initialData.recipients);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      try {
        const { data: subscriberList } = await supabase
          .from('subscribers')
          .select('*')
          .eq('subscribed', true)
          .order('created_at', { ascending: false });

        if (subscriberList) {
          setSubscribers(subscriberList);
        }
      } catch (error) {
        console.error('Error fetching subscribers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSubscribers();
    }
  }, [isOpen]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(subscribers.map(sub => sub.email));
    } else {
      setSelectedSubscribers([]);
    }
  };

  const handleSelectSubscriber = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(prev => [...prev, email]);
    } else {
      setSelectedSubscribers(prev => prev.filter(e => e !== email));
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setCampaign(prev => ({
      ...prev,
      content: template.content
    }));
    setShowTemplatePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const pendingImages = emailBuilderRef.current?.getPendingImages() || [];
      
      const uploadPromises = pendingImages.map(async ({ id, file }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}`;
        const filePath = `${fileName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('email-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('email-images')
          .getPublicUrl(filePath);

        return { id, url: data.publicUrl };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      let updatedContent = campaign.content;
      try {
        const blocks = JSON.parse(campaign.content);
        const updatedBlocks = blocks.map((block: any) => {
          const uploadedImage = uploadedImages.find(img => img.id === block.id);
          if (uploadedImage && block.type === 'image') {
            return { ...block, content: uploadedImage.url };
          }
          return block;
        });
        updatedContent = JSON.stringify(updatedBlocks);
      } catch (error) {
        console.error('Error parsing content:', error);
      }

      const campaignData = {
        name: campaign.name,
        subject: campaign.subject,
        content: updatedContent,
        recipients: selectedSubscribers
      };

      await onSubmit(campaignData);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleSegmentChange = (subscribers: any[]) => {
    setSegmentedSubscribers(subscribers);
    setSelectedSubscribers(subscribers.map(sub => sub.email));
  };

  const handleClose = () => {
    setCampaign(initialData);
    setSelectedSubscribers(initialData?.recipients || []);
    setSegmentedSubscribers([]);
    setShowSegmentation(false);
    setShowTemplatePicker(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {!showSegmentation ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Monthly Newsletter"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={campaign.subject}
                  onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Your Monthly Update"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Content
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTemplatePicker(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Choose Template
                  </button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto border rounded-lg p-4">
                  <EmailBuilder
                    ref={emailBuilderRef}
                    content={campaign.content}
                    onChange={(content) => setCampaign({ ...campaign, content })}
                  />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Recipients</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedSubscribers.length === subscribers.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Select All ({subscribers.length})
                      </span>
                    </label>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Loading subscribers...</div>
                    ) : (
                      <div className="divide-y">
                        {subscribers.map((subscriber) => (
                          <label
                            key={subscriber.email}
                            className="flex items-center px-4 py-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedSubscribers.includes(subscriber.email)}
                              onChange={(e) => handleSelectSubscriber(subscriber.email, e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-gray-900">{subscriber.email}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <p className="text-sm text-gray-700">
                      {selectedSubscribers.length} recipients selected
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSegmentation(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Segment Recipients
              </button>
            </form>
          ) : (
            <div>
              <button
                onClick={() => setShowSegmentation(false)}
                className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Campaign
              </button>
              <SegmentationBuilder onSegmentChange={handleSegmentChange} />
              <div className="mt-4 text-sm text-gray-500">
                {segmentedSubscribers.length} subscribers selected based on criteria
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="flex justify-center  min-w-[100px] px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <span>Cancel</span>
          </button>
          {!showSegmentation && (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex justify-center items-center min-w-[140px] px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span>{title === 'Edit Campaign' ? 'Save Changes' : 'Create Campaign'}</span>
            </button>
          )}
        </div>
      </div>
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </div>
  );
}

function SendCampaignModal({ campaign, onClose, onSend }: SendCampaignModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Campaign</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to send "{campaign.name}" to all subscribers?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}

function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState<Campaign | null>(null);
  const [reuseCampaign, setReuseCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(campaignData: NewCampaign) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          recipients: campaignData.recipients,
          status: 'draft'
        }])
        .select();

      if (error) throw error;
      if (data) {
        setCampaigns([data[0], ...campaigns]);
        setShowNewCampaignModal(false);
        setReuseCampaign(null);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  }

  const updateCampaign = async (updatedCampaign: NewCampaign) => {
    if (!editCampaign) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: updatedCampaign.name,
          subject: updatedCampaign.subject,
          content: updatedCampaign.content,
          recipients: updatedCampaign.recipients
        })
        .eq('id', editCampaign.id);

      if (error) throw error;

      setCampaigns(campaigns.map(campaign =>
        campaign.id === editCampaign.id
          ? {
              ...campaign,
              name: updatedCampaign.name,
              subject: updatedCampaign.subject,
              content: updatedCampaign.content,
              recipients: updatedCampaign.recipients
            }
          : campaign
      ));

      setEditCampaign(null);
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  async function deleteCampaign(id: string) {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCampaigns(campaigns.filter(campaign => campaign.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  }

  const handleSendComplete = async () => {
    if (showSendModal) {
      try {
        const blocks = JSON.parse(showSendModal.content);
        const htmlContent = convertBlocksToHtml(blocks);

        const result = await sendCampaign({
          name: showSendModal.name,
          subject: showSendModal.subject,
          content: htmlContent,
          recipientList: showSendModal.recipients
        });

        if (result.success) {
          const updatedCampaigns = campaigns.map(campaign =>
            campaign.id === showSendModal.id
              ? { ...campaign, status: 'sent', sent_at: new Date().toISOString() }
              : campaign
          );
          setCampaigns(updatedCampaigns);

          await supabase
            .from('campaigns')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString(),
              mailbuster_id: result.data.id
            })
            .eq('id', showSendModal.id);
        } else {
          console.error('Failed to send campaign:', result.error);
        }
      } catch (error) {
        console.error('Error sending campaign:', error);
      }
      setShowSendModal(null);
    }
  };

  const handleReuse = (campaign: Campaign) => {
    setReuseCampaign({
      ...campaign,
      name: `${campaign.name} (Copy)`,
      status: 'draft' as const,
      sent_at: null,
      scheduled_for: null
    });
    setShowNewCampaignModal(true);
  };

  function convertBlocksToHtml(blocks: any[]): string {
    return blocks.map(block => {
      switch (block.type) {
        case 'text':
          return `<div class="text-block">${block.content}</div>`;
        case 'image':
          return `<img src="${block.content}" alt="Email content" style="max-width: 100%; height: auto;" />`;
        case 'button':
          return `
            <a 
              href="${block.url}" 
              style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;"
            >
              ${block.content}
            </a>
          `;
        default:
          return '';
      }
    }).join('\n');
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage your email marketing campaigns
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowNewCampaignModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaign Modal - handles both new and reuse cases */}
      <CampaignModal
        isOpen={showNewCampaignModal || editCampaign !== null}
        onClose={() => {
          setShowNewCampaignModal(false);
          setReuseCampaign(null);
          setEditCampaign(null);
        }}
        initialData={editCampaign || reuseCampaign || undefined}
        onSubmit={editCampaign ? updateCampaign : createCampaign}
        title={editCampaign ? 'Edit Campaign' : (reuseCampaign ? 'Reuse Campaign' : 'Create New Campaign')}
      />

      {/* Send Campaign Modal */}
      {showSendModal && (
        <SendCampaignModal
          campaign={showSendModal}
          onClose={() => setShowSendModal(null)}
          onSend={handleSendComplete}
        />
      )}

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No campaigns found. Create your first campaign!</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subject</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {campaign.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campaign.subject}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            campaign.status === 'sent' 
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => setShowSendModal(campaign)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Send Campaign"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {campaign.status === 'sent' && (
                              <button
                                onClick={() => handleReuse(campaign)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Reuse Campaign"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditCampaign(campaign)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Campaign"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;