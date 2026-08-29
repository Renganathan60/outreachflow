import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Mail,
  Eye,
  MessageSquare,
  Calendar,
  Filter,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { formatPercent } from '../utils/formatters.js';

export default function Analytics() {
  const [dashboardData, setDashboardData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, pipe] = await Promise.all([
        analyticsService.getDashboardOverview(),
        analyticsService.getPipelineAnalytics(),
      ]);
      setDashboardData(dash);
      setPipelineData(pipe);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <LoadingState message="Calculating outbound marketing analytics and conversion funnels..." />;
  if (error) return <ErrorState message={error} onRetry={loadAnalytics} />;

  const {
    totalLeads = 0,
    emailsSent = 0,
    emailsOpened = 0,
    replies = 0,
    interestedLeads = 0,
    meetingsScheduled = 0,
    conversions = 0,
    conversionRate = 0,
  } = dashboardData || {};

  const funnelSteps = [
    { label: 'Total Enrolled Leads', count: totalLeads, color: 'from-indigo-600 to-indigo-500', pct: 100 },
    { label: 'Outreach Delivered', count: emailsSent, color: 'from-blue-600 to-blue-500', pct: totalLeads > 0 ? Math.round((emailsSent / totalLeads) * 100) : 0 },
    { label: 'Emails Opened', count: emailsOpened, color: 'from-cyan-600 to-cyan-500', pct: emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0 },
    { label: 'Replies & Engagement', count: replies, color: 'from-purple-600 to-purple-500', pct: emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0 },
    { label: 'Interested / Demo Intent', count: interestedLeads, color: 'from-amber-600 to-amber-500', pct: replies > 0 ? Math.round((interestedLeads / replies) * 100) : 0 },
    { label: 'Discovery Meetings Booked', count: meetingsScheduled, color: 'from-emerald-600 to-emerald-500', pct: interestedLeads > 0 ? Math.round((meetingsScheduled / interestedLeads) * 100) : 0 },
    { label: 'Closed Won Customers', count: conversions, color: 'from-teal-600 to-teal-500', pct: totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Outbound Marketing Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-funnel pipeline visibility from cold email delivery to closed-won enterprise accounts.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAnalytics} icon={RefreshCw}>
          Refresh Analytics
        </Button>
      </div>

      {/* Top Conversion Rates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Rate"
          value={`${emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0}%`}
          subtitle={`${emailsOpened} opens / ${emailsSent} delivered`}
          icon={Eye}
          color="blue"
        />

        <StatCard
          title="Reply Rate"
          value={`${emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0}%`}
          subtitle={`${replies} prospect replies`}
          icon={MessageSquare}
          color="purple"
        />

        <StatCard
          title="Meeting Booking Rate"
          value={`${replies > 0 ? Math.round((meetingsScheduled / replies) * 100) : 0}%`}
          subtitle={`${meetingsScheduled} demo meetings scheduled`}
          icon={Calendar}
          color="emerald"
        />

        <StatCard
          title="Pipeline Conversion"
          value={`${conversionRate}%`}
          subtitle={`${conversions} converted customers`}
          icon={Award}
          color="indigo"
        />
      </div>

      {/* Outbound Conversion Funnel */}
      <Card
        title="Outbound Sales Funnel Drop-off"
        subtitle="Tracking account progression through every stage of the outreach sequence"
      >
        <div className="space-y-4 py-2">
          {funnelSteps.map((step, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                    {idx + 1}
                  </span>
                  {step.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{step.pct}% Stage Efficiency</span>
                  <span className="font-bold text-slate-900 text-sm">{step.count}</span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className={`bg-gradient-to-r ${step.color} h-full rounded-full transition-all duration-700`}
                  style={{
                    width: `${totalLeads > 0 ? Math.max(4, (step.count / totalLeads) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid: Industry Performance & Source Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Breakdown */}
        <Card
          title="Industry Performance & Average Lead Score"
          subtitle="Priority scores grouped by vertical"
        >
          <div className="space-y-3">
            {pipelineData?.industryDistribution?.map((ind, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{ind.industry}</p>
                  <p className="text-[10px] text-slate-500">{ind.count} accounts in database</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">
                    Avg Score: {Math.round(ind.avgScore || 0)}/100
                  </span>
                  <p className="text-[10px] text-indigo-700 font-medium">
                    {ind.avgScore >= 70 ? 'High Propensity' : 'Standard'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Source Effectiveness */}
        <Card
          title="Lead Acquisition Source Performance"
          subtitle="Qualified conversion rate by lead channel"
        >
          <div className="space-y-3">
            {pipelineData?.sourcePerformance?.map((src, idx) => {
              const qualRate = src.total > 0 ? Math.round((src.qualifiedCount / src.total) * 100) : 0;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{src.source}</span>
                    <p className="text-[10px] text-slate-500">{src.total} total leads imported</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-700">{qualRate}% Qualified</span>
                    <p className="text-[10px] text-slate-500">{src.qualifiedCount} high-intent leads</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
