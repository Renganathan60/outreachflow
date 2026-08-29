import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Building,
  Briefcase,
  Phone,
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Edit3
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import Select from '../components/common/Select.jsx';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates.jsx';
import ActivityTimeline from '../components/features/ActivityTimeline.jsx';
import { leadService } from '../services/leadService.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  LEAD_STATUSES,
  LEAD_HEALTH_MAP,
  PRIORITY_TIERS,
  EMAIL_VERIFICATION_MAP
} from '../utils/constants.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { success, error: toastError } = useToast();

  const loadLeadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadData, scoreData, actData] = await Promise.all([
        leadService.getLeadById(id),
        leadService.getScoreExplanation(id),
        leadService.getLeadActivities(id),
      ]);
      setLead(leadData);
      setExplanation(scoreData);
      setActivities(actData);
    } catch (err) {
      setError(err.message || 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLeadData();
  }, [loadLeadData]);

  const handleStatusChange = async (newStatus) => {
    if (!lead || newStatus === lead.status) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await leadService.updateLead(lead.id, { status: newStatus });
      setLead(updated);
      success(`Lead status updated to ${newStatus}. Priority score recalculated!`);
      loadLeadData();
    } catch (err) {
      toastError(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!lead) return;
    setIsVerifying(true);
    try {
      const updated = await leadService.verifyLeadEmail(lead.id);
      setLead(updated);
      success(`Email verified! Deliverability: ${updated.emailVerificationStatus}`);
      loadLeadData();
    } catch (err) {
      toastError(err.message || 'Email verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) return <LoadingState message="Loading lead profile & computing explainable scoring factors..." />;
  if (error) return <ErrorState message={error} onRetry={loadLeadData} />;
  if (!lead) return <ErrorState message="Lead record not found" onRetry={() => navigate('/leads')} />;

  const score = lead.priorityScore ?? 0;
  const tier = score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';
  const tierMeta = PRIORITY_TIERS[tier];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/leads')} icon={ArrowLeft}>
          Back to Leads
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyEmail}
            isLoading={isVerifying}
            icon={ShieldCheck}
          >
            Re-Verify Email
          </Button>
          <Button variant="primary" size="sm" onClick={loadLeadData} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Lead Profile Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-200 shrink-0">
              {lead.firstName[0]}
              {lead.lastName[0]}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {lead.firstName} {lead.lastName}
                </h1>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    LEAD_HEALTH_MAP[lead.leadHealth]?.color || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Health: {LEAD_HEALTH_MAP[lead.leadHealth]?.label || lead.leadHealth}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    EMAIL_VERIFICATION_MAP[lead.emailVerificationStatus]?.color || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {EMAIL_VERIFICATION_MAP[lead.emailVerificationStatus]?.label || lead.emailVerificationStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  {lead.jobTitle}
                </span>
                <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  {lead.company}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {lead.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Priority Score Display */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Decision Engine</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tierMeta.badge}`}>
                  {tier} PRIORITY
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-200 flex flex-col items-center justify-center shadow-xs">
              <span className="text-xl font-black text-indigo-700">{score}</span>
              <span className="text-[9px] uppercase font-bold text-slate-400">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Explainability & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Scoring Logic */}
        <div className="space-y-6">
          {/* Status Changer */}
          <Card title="Lifecycle Status" subtitle="Change status to update scoring & health">
            <Select
              value={lead.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={LEAD_STATUSES}
            />
            <p className="text-[11px] text-slate-500 mt-2">
              Transitions like <code className="text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded">REPLIED</code> or <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">MEETING</code> automatically grant priority points and update lead health state.
            </p>
          </Card>

          {/* Lead Meta Information */}
          <Card title="Account Attributes">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Industry:</span>
                <span className="font-semibold text-slate-800">{lead.industry}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Company Size:</span>
                <span className="font-semibold text-slate-800">{lead.companySize} employees</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Lead Source:</span>
                <span className="font-semibold text-slate-800">{lead.source}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Created:</span>
                <span className="font-semibold text-slate-800">{formatDate(lead.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Last Updated:</span>
                <span className="font-semibold text-slate-800">{formatDateTime(lead.updatedAt)}</span>
              </div>
            </div>
          </Card>

          {/* Enrolled Campaigns */}
          <Card title="Campaign Enrollments" subtitle="Active outbound campaign cadences">
            {lead.enrolledCampaigns && lead.enrolledCampaigns.length > 0 ? (
              <div className="space-y-2">
                {lead.enrolledCampaigns.map((camp) => (
                  <div
                    key={camp.id || camp.campaignId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{camp.campaignName}</p>
                      <p className="text-[10px] text-slate-500">
                        Status: <span className="font-semibold text-indigo-700">{camp.status || camp.enrollmentStatus}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        camp.campaignStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {camp.campaignStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                Not enrolled in any campaigns yet. Enroll from the Campaigns page.
              </p>
            )}
          </Card>

          {/* Explainability Breakdown Card */}
          <Card
            title="Explainable Scoring Factors"
            subtitle="Transparent rule checklist justifying this lead's rank"
          >
            <div className="space-y-2.5">
              {explanation?.factors?.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    f.applied
                      ? 'bg-indigo-50/40 border-indigo-100 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {f.applied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={f.applied ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                      {f.description}
                    </span>
                  </div>

                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      f.applied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {f.applied ? `+${f.points}` : '0'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Activity Timeline & Live Engagement Simulator */}
        <div className="lg:col-span-2">
          <Card
            title="Engagement Timeline & Live Simulator"
            subtitle="Interactive chronological activity stream with automatic scoring trigger"
          >
            <ActivityTimeline
              lead={lead}
              activities={activities}
              onActivityLogged={loadLeadData}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
