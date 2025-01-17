import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Mail, MousePointerClick, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface CampaignAnalytics {
  campaign_name: string;
  total_recipients: number;
  opens: number;
  clicks: number;
  open_rate: number;
  click_rate: number;
  sent_date: string;
}

interface SubscriberGrowth {
  date: string;
  count: number;
}

function Analytics() {
  const [campaignStats, setCampaignStats] = useState<CampaignAnalytics[]>([]);
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [avgOpenRate, setAvgOpenRate] = useState(0);
  const [avgClickRate, setAvgClickRate] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      // Fetch campaign analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaigns')
        .select(`
          name,
          sent_at,
          campaign_analytics (
            opened,
            clicked
          )
        `)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Process campaign analytics
      const processedCampaigns = analyticsData?.map(campaign => {
        const totalRecipients = campaign.campaign_analytics.length;
        const opens = campaign.campaign_analytics.filter(a => a.opened).length;
        const clicks = campaign.campaign_analytics.filter(a => a.clicked).length;
        
        return {
          campaign_name: campaign.name,
          total_recipients: totalRecipients,
          opens,
          clicks,
          open_rate: totalRecipients ? (opens / totalRecipients) * 100 : 0,
          click_rate: totalRecipients ? (clicks / totalRecipients) * 100 : 0,
          sent_date: campaign.sent_at
        };
      }) || [];

      setCampaignStats(processedCampaigns);
      setTotalCampaigns(processedCampaigns.length);
      
      if (processedCampaigns.length > 0) {
        setAvgOpenRate(
          processedCampaigns.reduce((acc, curr) => acc + curr.open_rate, 0) / 
          processedCampaigns.length
        );
        setAvgClickRate(
          processedCampaigns.reduce((acc, curr) => acc + curr.click_rate, 0) / 
          processedCampaigns.length
        );
      }

      // Fetch subscriber growth
      const { count } = await supabase
        .from('subscribers')
        .select('*', { count: true });

      setTotalSubscribers(count || 0);

      // Fetch subscriber growth over time
      const { data: growthData, error: growthError } = await supabase
        .from('subscribers')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (growthError) throw growthError;

      // Process subscriber growth by month
      const growthByMonth = growthData?.reduce((acc: Record<string, number>, curr) => {
        const monthYear = format(new Date(curr.created_at), 'MMM yyyy');
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
      }, {});

      setSubscriberGrowth(
        Object.entries(growthByMonth || {}).map(([date, count]) => ({
          date,
          count
        }))
      );
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your campaign performance and subscriber engagement
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Subscribers
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {totalSubscribers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Campaigns Sent
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {totalCampaigns}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Open Rate
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {avgOpenRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MousePointerClick className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Click Rate
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {avgClickRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Campaign Performance</h2>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading analytics...</div>
                ) : campaignStats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No campaign data available yet.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Campaign</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Recipients</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Opens</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Clicks</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Open Rate</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Click Rate</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sent Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {campaignStats.map((campaign, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {campaign.campaign_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.total_recipients}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.opens}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.clicks}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.open_rate.toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.click_rate.toFixed(1)}%
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {format(new Date(campaign.sent_date), 'MMM d, yyyy')}
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

      {/* Subscriber Growth */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Subscriber Growth</h2>
        <div className="mt-4 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriberGrowth.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b">
                <span className="text-sm text-gray-600">{data.date}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {data.count} new subscribers
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;