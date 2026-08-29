import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Send,
  Mail,
  Eye,
  MessageSquare,
  Sparkles,
  Calendar,
  Award,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Plus
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates.jsx';
import LeadScoreModal from '../components/features/LeadScoreModal.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { formatPercent, timeAgo } from '../utils/formatters.js';
import { PRIORITY_TIERS, LEAD_HEALTH_MAP } from '../utils/constants.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScoreLead, setSelectedScoreLead] = useState(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getDashboardOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <LoadingState message="Aggregating pipeline metrics & lead score distributions..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  const {
    totalLeads = 0,
    activeCampaigns = 0,
    emailsSent = 0,
    emailsOpened = 0,
    replies = 0,
    interestedLeads = 0,
    meetingsScheduled = 0,
    conversions = 0,
    conversionRate = 0,
    priorityDistribution = { high: 0, medium: 0, low: 0 },
    healthDistribution = { active: 0, needsFollowUp: 0, highIntent: 0, unresponsive: 0, doNotContact: 0 },
    recentActivities = [],
    topPriorityLeads = [],
  } = data || {};

  const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
  const replyRate = emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-100 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Intelligent Prioritization
            </span>
            <span className="text-xs font-semibold text-slate-500">Outreach Health: 94/100</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Prioritize High-Intent Accounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mt-1">
            Don't just manage leads — decide which accounts deserve sales attention with transparent 0-100 scoring and Campaign Guard safety.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')} icon={Send}>
            View Campaigns
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/leads')} icon={Plus}>
            Manage Leads
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          subtitle="Managed in database"
          icon={Users}
          color="indigo"
        />

        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          subtitle="Live cadences running"
          icon={Send}
          color="purple"
        />

        <StatCard
          title="Emails Delivered"
          value={emailsSent}
          trend={`${openRate}% Open Rate`}
          trendPositive={openRate >= 40}
          icon={Mail}
          color="blue"
        />

        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle={`${conversions} Won Customers`}
          trend={`${replyRate}% Reply Rate`}
          trendPositive={replyRate >= 15}
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Middle Grid: Distribution Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution Card */}
        <Card
          title="Lead Priority Distribution"
          subtitle="Rule-based classification from 0-100 score engine"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
              View Table <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          }
        >
          <div className="space-y-4">
            {/* High Priority */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  High Priority (80-100 Score)
                </span>
                <span className="text-slate-700">
                  {priorityDistribution.high} leads (
                  {totalLeads > 0 ? Math.round((priorityDistribution.high / totalLeads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (priorityDistribution.high / totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Medium Priority */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Medium Priority (50-79 Score)
                </span>
                <span className="text-slate-700">
                  {priorityDistribution.medium} leads (
                  {totalLeads > 0 ? Math.round((priorityDistribution.medium / totalLeads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (priorityDistribution.medium / totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Low Priority */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Low Priority (0-49 Score)
                </span>
                <span className="text-slate-700">
                  {priorityDistribution.low} leads (
                  {totalLeads > 0 ? Math.round((priorityDistribution.low / totalLeads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (priorityDistribution.low / totalLeads) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Lead Health Distribution */}
        <Card
          title="Lead Engagement Health Status"
          subtitle="Dynamic state machine derived from activity history"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(LEAD_HEALTH_MAP).map(([key, meta]) => {
              const count =
                key === 'ACTIVE'
                  ? healthDistribution.active
                  : key === 'NEEDS_FOLLOW_UP'
                  ? healthDistribution.needsFollowUp
                  : key === 'HIGH_INTENT'
                  ? healthDistribution.highIntent
                  : key === 'UNRESPONSIVE'
                  ? healthDistribution.unresponsive
                  : healthDistribution.doNotContact;

              return (
                <div
                  key={key}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-start ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="mt-3">
                    <p className="text-xl font-extrabold text-slate-900">{count || 0}</p>
                    <p className="text-[10px] text-slate-500">
                      {totalLeads > 0 ? Math.round(((count || 0) / totalLeads) * 100) : 0}% of pipeline
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Top Priority Leads & Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Priority Leads Table */}
        <div className="lg:col-span-2">
          <Card
            title="Top Priority Leads (Attention Recommended)"
            subtitle="Ranked by decision-maker title, company tier, and engagement signals"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
                View All Leads
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Lead Name</th>
                    <th className="pb-3">Company & Title</th>
                    <th className="pb-3">Priority Score</th>
                    <th className="pb-3">Health</th>
                    <th className="pb-3 text-right">Scoring Logic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topPriorityLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <td className="py-3 font-semibold text-slate-900">
                        {lead.firstName} {lead.lastName}
                        <p className="text-[10px] font-normal text-slate-500 font-mono">{lead.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-800">{lead.company}</span>
                        <p className="text-[10px] text-slate-500">{lead.jobTitle}</p>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-emerald-600">{lead.priorityScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            LEAD_HEALTH_MAP[lead.leadHealth]?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.leadHealth}
                        </span>
                      </td>
                      <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScoreLead(lead)}
                          icon={Sparkles}
                          className="text-[11px] py-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                          Why this score?
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Activity Stream */}
        <div>
          <Card
            title="Recent Activity Feed"
            subtitle="Real-time campaign engagements"
          >
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{timeAgo(act.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Lead: <span className="text-slate-800 font-semibold">{act.firstName} {act.lastName}</span> ({act.company})
                  </p>
                  {act.campaignName && (
                    <p className="text-[10px] text-indigo-600 mt-1 truncate font-medium">
                      Campaign: {act.campaignName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Lead Score Explanation Modal */}
      {selectedScoreLead && (
        <LeadScoreModal
          isOpen={!!selectedScoreLead}
          onClose={() => setSelectedScoreLead(null)}
          lead={selectedScoreLead}
        />
      )}
    </div>
  );
}
