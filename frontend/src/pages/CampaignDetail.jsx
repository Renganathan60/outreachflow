import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Send,
  Mail,
  Eye,
  MessageSquare,
  Sparkles,
  Calendar,
  Award,
  ShieldCheck,
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle,
  Filter
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/common/FeedbackStates.jsx';
import SequenceBuilder from '../components/features/SequenceBuilder.jsx';
import CampaignGuardModal from '../components/features/CampaignGuardModal.jsx';
import { campaignService } from '../services/campaignService.js';
import { leadService } from '../services/leadService.js';
import { useToast } from '../context/ToastContext.jsx';
import { CAMPAIGN_STATUS_MAP, LEAD_HEALTH_MAP } from '../utils/constants.js';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [sequence, setSequence] = useState(null);
  const [enrolledLeads, setEnrolledLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sequence'); // 'sequence' | 'leads'

  // Enrollment Modal & Campaign Guard State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allAvailableLeads, setAllAvailableLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [guardPreview, setGuardPreview] = useState(null);
  const [isEvaluatingGuard, setIsEvaluatingGuard] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const { success, error: toastError } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campData, seqData, leadsData] = await Promise.all([
        campaignService.getCampaignById(id),
        campaignService.getSequence(id),
        campaignService.getCampaignLeads(id),
      ]);
      setCampaign(campData);
      setSequence(seqData);
      setEnrolledLeads(leadsData);
    } catch (err) {
      setError(err.message || 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEnrollModal = async () => {
    setIsEnrollModalOpen(true);
    setSelectedLeadIds([]);
    try {
      const res = await leadService.getLeads({ limit: 100 });
      setAllAvailableLeads(res.leads);
    } catch (err) {
      toastError('Failed to fetch available leads');
    }
  };

  const handleToggleLeadSelection = (leadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((i) => i !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeadIds.length === allAvailableLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(allAvailableLeads.map((l) => l.id));
    }
  };

  const handleRunGuardPreview = async () => {
    if (selectedLeadIds.length === 0) {
      toastError('Please select at least one lead to evaluate.');
      return;
    }
    setIsEvaluatingGuard(true);
    try {
      const preview = await campaignService.previewGuard(id, selectedLeadIds);
      setGuardPreview(preview);
    } catch (err) {
      toastError(err.message || 'Campaign Guard preview failed');
    } finally {
      setIsEvaluatingGuard(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!guardPreview || guardPreview.eligibleLeads.length === 0) return;
    setIsEnrolling(true);
    try {
      const eligibleIds = guardPreview.eligibleLeads.map((l) => l.id);
      const res = await campaignService.enrollLeads(id, eligibleIds);
      success(
        `Campaign Guard enrolled ${res.enrolledCount} eligible leads! ${res.blockedCount} blocked for policy safety.`
      );
      setGuardPreview(null);
      setIsEnrollModalOpen(false);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to enroll leads');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveLead = async (leadId) => {
    if (!confirm('Remove this lead from this campaign?')) return;
    try {
      await campaignService.removeLead(id, leadId);
      success('Lead removed from campaign');
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to remove lead');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await campaignService.updateCampaign(id, { status: newStatus });
      success(`Campaign status changed to ${newStatus}`);
      loadData();
    } catch (err) {
      toastError(err.message || 'Failed to change status');
    }
  };

  if (loading) return <LoadingState message="Loading campaign details, sequence cadence, and analytics..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!campaign) return <ErrorState message="Campaign not found" onRetry={() => navigate('/campaigns')} />;

  const stats = campaign.stats || {
    totalLeads: 0,
    emailsSent: 0,
    opened: 0,
    replies: 0,
    interested: 0,
    meetings: 0,
    converted: 0,
    openRate: 0,
    replyRate: 0,
    interestRate: 0,
    conversionRate: 0,
  };

  const statusMeta = CAMPAIGN_STATUS_MAP[campaign.status] || CAMPAIGN_STATUS_MAP.DRAFT;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')} icon={ArrowLeft}>
          Back to Campaigns
        </Button>

        <div className="flex items-center gap-2">
          {campaign.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('PAUSED')}
              icon={Pause}
              className="text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              Pause Campaign
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleStatusChange('ACTIVE')}
              icon={Play}
            >
              Activate Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Campaign Guard Protected
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{campaign.name}</h1>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">{campaign.description || 'No description'}</p>
          </div>

          <div className="flex items-center gap-4 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 shrink-0">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Enrolled Leads</p>
              <p className="text-xl font-black text-indigo-700">{enrolledLeads.length}</p>
            </div>
            <div className="border-l border-indigo-200 pl-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Reply Rate</p>
              <p className="text-xl font-black text-emerald-700">{stats.replyRate}%</p>
            </div>
            <div className="border-l border-indigo-200 pl-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Conversion</p>
              <p className="text-xl font-black text-teal-700">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Emails Delivered"
          value={stats.emailsSent}
          trend={`${stats.openRate}% Open Rate`}
          trendPositive={stats.openRate >= 40}
          icon={Mail}
          color="indigo"
        />
        <StatCard
          title="Responses Received"
          value={stats.replies}
          trend={`${stats.replyRate}% Reply Rate`}
          trendPositive={stats.replyRate >= 15}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="Meetings Booked"
          value={stats.meetings}
          subtitle={`${stats.interested} Qualified Leads`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Won Customers"
          value={stats.converted}
          subtitle={`${stats.conversionRate}% Conversion`}
          icon={Award}
          color="blue"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sequence')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sequence'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Email Cadence Sequence ({sequence?.steps?.length || 0} Steps)
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'leads'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Enrolled Leads ({enrolledLeads.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sequence' ? (
        <Card>
          <SequenceBuilder
            campaignId={id}
            sequence={sequence}
            onSequenceUpdated={loadData}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Only leads that pass the 7-point deliverability validation can be enrolled.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenEnrollModal}
              icon={ShieldCheck}
            >
              Enroll Leads with Campaign Guard
            </Button>
          </div>

          <Card bodyClassName="p-0">
            {enrolledLeads.length === 0 ? (
              <EmptyState
                title="No Leads Enrolled in this Campaign"
                description="Click 'Enroll Leads with Campaign Guard' to screen and add target leads safely."
                actionLabel="Enroll Leads"
                onAction={handleOpenEnrollModal}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Lead Name</th>
                      <th className="py-3 px-4">Company & Role</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Health</th>
                      <th className="py-3 px-4">Enrollment Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrolledLeads.map((item) => (
                      <tr key={item.enrollmentId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.firstName} {item.lastName}
                          <p className="text-[10px] font-normal text-slate-500 font-mono">{item.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{item.company}</span>
                          <p className="text-[10px] text-slate-500">{item.jobTitle}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-700 text-xs">{item.priorityScore}/100</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              LEAD_HEALTH_MAP[item.leadHealth]?.color || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.leadHealth}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.enrollmentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => handleRemoveLead(item.leadId)}
                            icon={Trash2}
                            title="Remove from campaign"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Select Leads for Enrollment Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Select Leads for Campaign Enrollment"
        subtitle="Campaign Guard will automatically evaluate suppression lists, email verification, duplicate status, and health states before adding."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Selected: <strong className="text-indigo-700">{selectedLeadIds.length}</strong> / {allAvailableLeads.length}
            </span>
            <button
              type="button"
              onClick={handleSelectAllLeads}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {selectedLeadIds.length === allAvailableLeads.length ? 'Deselect All' : 'Select All Leads'}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2">
            {allAvailableLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              return (
                <div
                  key={lead.id}
                  onClick={() => handleToggleLeadSelection(lead.id)}
                  className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[10px] text-slate-500">{lead.company} • {lead.jobTitle} • {lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      Score: {lead.priorityScore}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {lead.leadHealth}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRunGuardPreview}
              isLoading={isEvaluatingGuard}
              disabled={selectedLeadIds.length === 0}
              icon={ShieldCheck}
            >
              Run Campaign Guard on {selectedLeadIds.length} Leads
            </Button>
          </div>
        </div>
      </Modal>

      {/* Campaign Guard Preview & Confirmation Modal */}
      {guardPreview && (
        <CampaignGuardModal
          isOpen={!!guardPreview}
          onClose={() => setGuardPreview(null)}
          campaign={campaign}
          previewData={guardPreview}
          onConfirmEnroll={handleConfirmEnrollment}
          isSubmitting={isEnrolling}
        />
      )}
    </div>
  );
}
