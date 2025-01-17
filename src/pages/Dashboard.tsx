import React, { useEffect, useState } from 'react';
import { Users, Mail, BarChart3, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface DashboardStats {
  totalSubscribers: number;
  campaignsSent: number;
  averageOpenRate: number;
  scheduledCampaigns: number;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: 'campaign' | 'subscriber' | 'analytics';
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSubscribers: 0,
    campaignsSent: 0,
    averageOpenRate: 0,
    scheduledCampaigns: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch total subscribers
      const { count: subscribersCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact' });

      // Fetch campaign statistics
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*');

      const sentCampaigns = campaigns?.filter(c => c.status === 'sent') || [];
      const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled') || [];

      // Fetch campaign analytics for open rate
      const { data: analytics } = await supabase
        .from('campaign_analytics')
        .select('*');

      // Calculate average open rate
      const totalOpens = analytics?.filter(a => a.opened).length || 0;
      const totalRecipients = analytics?.length || 1; // Prevent division by zero
      const openRate = (totalOpens / totalRecipients) * 100;

      setStats({
        totalSubscribers: subscribersCount || 0,
        campaignsSent: sentCampaigns.length,
        averageOpenRate: openRate,
        scheduledCampaigns: scheduledCampaigns.length
      });

      // Fetch recent activity
      const recentActivities: RecentActivity[] = [];

      // Add recent campaigns
      const recentCampaigns = campaigns
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map(campaign => ({
          id: campaign.id,
          title: `Campaign "${campaign.name}" ${campaign.status}`,
          time: campaign.created_at,
          type: 'campaign' as const
        })) || [];

      // Add recent subscribers
      const { data: recentSubscribers } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const recentSubs = recentSubscribers?.map(sub => ({
        id: sub.id,
        title: `New subscriber: ${sub.email}`,
        time: sub.created_at,
        type: 'subscriber' as const
      })) || [];

      // Combine and sort all activities
      recentActivities.push(...recentCampaigns, ...recentSubs);
      recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setRecentActivity(recentActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Subscribers"
          value={stats.totalSubscribers.toLocaleString()}
          icon={Users}
          color="text-blue-500"
        />
        <StatCard
          title="Campaigns Sent"
          value={stats.campaignsSent.toLocaleString()}
          icon={Mail}
          color="text-green-500"
        />
        <StatCard
          title="Average Open Rate"
          value={`${stats.averageOpenRate.toFixed(1)}%`}
          icon={BarChart3}
          color="text-purple-500"
        />
        <StatCard
          title="Scheduled Campaigns"
          value={stats.scheduledCampaigns.toLocaleString()}
          icon={Clock}
          color="text-yellow-500"
        />
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== recentActivity.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                            {activity.type === 'campaign' ? (
                              <Mail className="h-5 w-5 text-gray-500" />
                            ) : activity.type === 'subscriber' ? (
                              <Users className="h-5 w-5 text-gray-500" />
                            ) : (
                              <BarChart3 className="h-5 w-5 text-gray-500" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.title}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{format(new Date(activity.time), 'MMM d, yyyy')}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;