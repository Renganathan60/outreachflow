import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Users,
  Eye,
  Trash2,
  ShieldCheck,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates.jsx';
import { campaignService } from '../services/campaignService.js';
import { useToast } from '../context/ToastContext.jsx';
import { CAMPAIGN_STATUS_MAP } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const created = await campaignService.createCampaign({
        name: name.trim(),
        description: description.trim() || null,
      });
      success(`Campaign '${created.name}' created with default cadence sequence!`);
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      loadCampaigns();
      navigate(`/campaigns/${created.id}`);
    } catch (err) {
      toastError(err.message || 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusToggle = async (campaign, newStatus) => {
    try {
      await campaignService.updateCampaign(campaign.id, { status: newStatus });
      success(`Campaign status updated to ${newStatus}`);
      loadCampaigns();
    } catch (err) {
      toastError(err.message || 'Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return;
    try {
      await campaignService.deleteCampaign(deletingCampaign.id);
      success('Campaign deleted successfully');
      setDeletingCampaign(null);
      loadCampaigns();
    } catch (err) {
      toastError(err.message || 'Failed to delete campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Outreach Campaigns & Cadences</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-touch sequences protected by the 7-point Campaign Guard deliverability validator.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
          New Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <LoadingState message="Loading outbound marketing campaigns..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCampaigns} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No Campaigns Created Yet"
          description="Create your first targeted outreach campaign to start enrolling scored leads."
          actionLabel="Create Campaign"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const statusMeta = CAMPAIGN_STATUS_MAP[camp.status] || CAMPAIGN_STATUS_MAP.DRAFT;
            const leadCount = camp.leadCount || 0;

            return (
              <Card
                key={camp.id}
                hoverEffect
                className="cursor-pointer group flex flex-col justify-between bg-white border border-slate-200 shadow-xs"
                onClick={() => navigate(`/campaigns/${camp.id}`)}
              >
                <div>
                  {/* Status & Created Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                    <span className="text-[11px] text-slate-500">Created {formatDate(camp.createdAt)}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {camp.description || 'No description provided.'}
                  </p>
                </div>

                {/* Bottom Meta & Quick Controls */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold">{leadCount}</span>
                    <span className="text-slate-500">enrolled leads</span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {camp.status === 'ACTIVE' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(camp, 'PAUSED')}
                        icon={Pause}
                        className="text-amber-700 border-amber-200 hover:bg-amber-50"
                        title="Pause Campaign"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(camp, 'ACTIVE')}
                        icon={Play}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        title="Activate Campaign"
                      >
                        Activate
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/campaigns/${camp.id}`)}
                      icon={Eye}
                      title="Inspect Campaign Details"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => setDeletingCampaign(camp)}
                      icon={Trash2}
                      title="Delete Campaign"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Outreach Campaign"
        subtitle="Initialize campaign parameters and configure automated email cadence."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="e.g. Q3 Enterprise CTO Outreach"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Description / Target Audience
            </label>
            <textarea
              rows={3}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
              placeholder="Outreach targeting CTOs and VPs of Engineering at companies with 200+ employees..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isCreating}>
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Campaign Confirmation */}
      {deletingCampaign && (
        <ConfirmDialog
          isOpen={!!deletingCampaign}
          onClose={() => setDeletingCampaign(null)}
          onConfirm={handleDeleteCampaign}
          title="Delete Campaign"
          message={`Are you sure you want to delete '${deletingCampaign.name}'? This removes sequence steps and enrollment links.`}
          confirmText="Delete Campaign"
        />
      )}
    </div>
  );
}
