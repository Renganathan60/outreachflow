import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Eye,
  Trash2,
  Download,
  Upload,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates.jsx';
import LeadScoreModal from '../components/features/LeadScoreModal.jsx';
import { leadService } from '../services/leadService.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  LEAD_STATUSES,
  LEAD_HEALTH_MAP,
  PRIORITY_TIERS,
  EMAIL_VERIFICATION_MAP,
  INDUSTRIES,
  COMPANY_SIZES,
  SOURCES
} from '../utils/constants.js';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [priorityTierFilter, setPriorityTierFilter] = useState('');
  const [sortBy, setSortBy] = useState('priorityScore');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedScoreLead, setSelectedScoreLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    industry: 'Technology',
    companySize: '51-200',
    source: 'LINKEDIN',
    status: 'NEW',
  });

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadService.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter || undefined,
        industry: industryFilter || undefined,
        leadHealth: healthFilter || undefined,
        emailVerificationStatus: verificationFilter || undefined,
        priorityTier: priorityTierFilter || undefined,
        sortBy,
        sortOrder,
      });
      setLeads(res.leads);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    statusFilter,
    industryFilter,
    healthFilter,
    verificationFilter,
    priorityTierFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await leadService.createLead(newLead);
      success(`Lead '${created.firstName} ${created.lastName}' added with priority score: ${created.priorityScore}/100!`);
      setIsCreateModalOpen(false);
      setNewLead({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        industry: 'Technology',
        companySize: '51-200',
        source: 'LINKEDIN',
        status: 'NEW',
      });
      fetchLeads();
    } catch (err) {
      toastError(err.message || 'Failed to create lead');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    try {
      await leadService.deleteLead(deletingLead.id);
      success('Lead deleted successfully');
      setDeletingLead(null);
      fetchLeads();
    } catch (err) {
      toastError(err.message || 'Failed to delete lead');
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Company', 'Job Title', 'Industry', 'Size', 'Status', 'Score', 'Health', 'Verification'];
    const rows = leads.map(l => [
      l.id, l.firstName, l.lastName, l.email, l.company, l.jobTitle, l.industry, l.companySize, l.status, l.priorityScore, l.leadHealth, l.emailVerificationStatus
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `outreachflow_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Lead Management & Prioritization</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Decide which leads deserve attention with transparent 0-100 rule-based scoring and health tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} icon={Download}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by name, email, company, title..."
              icon={Search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[{ value: '', label: 'All Lead Statuses' }, ...LEAD_STATUSES]}
          />

          {/* Priority Tier Filter */}
          <Select
            value={priorityTierFilter}
            onChange={(e) => {
              setPriorityTierFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Priority Tiers' },
              { value: 'HIGH', label: 'High Priority (80-100)' },
              { value: 'MEDIUM', label: 'Medium Priority (50-79)' },
              { value: 'LOW', label: 'Low Priority (0-49)' },
            ]}
          />
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
          <Select
            value={healthFilter}
            onChange={(e) => {
              setHealthFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Health States' },
              ...Object.entries(LEAD_HEALTH_MAP).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />

          <Select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Verification' },
              ...Object.entries(EMAIL_VERIFICATION_MAP).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />

          <Select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[{ value: '', label: 'All Industries' }, ...INDUSTRIES.map(i => ({ value: i, label: i }))]}
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'priorityScore', label: 'Sort by: Priority Score' },
              { value: 'createdAt', label: 'Sort by: Created Date' },
              { value: 'company', label: 'Sort by: Company' },
              { value: 'status', label: 'Sort by: Status' },
            ]}
          />
        </div>
      </Card>

      {/* Main Leads Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <LoadingState message="Loading and scoring leads from database..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchLeads} />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads match your criteria"
            description="Try relaxing your search terms or filters, or add a new lead."
            actionLabel="Add Lead"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Lead & Contact</th>
                  <th className="py-3.5 px-4">Company / Role</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const isHigh = lead.priorityScore >= 80;
                  const isMed = lead.priorityScore >= 50 && lead.priorityScore < 80;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.email}</p>
                      </td>

                      {/* Company & Role */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{lead.company}</span>
                        <p className="text-[11px] text-slate-500">{lead.jobTitle}</p>
                        <span className="text-[10px] text-slate-400">{lead.industry} • {lead.companySize}</span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            EMAIL_VERIFICATION_MAP[lead.emailVerificationStatus]?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {EMAIL_VERIFICATION_MAP[lead.emailVerificationStatus]?.label || lead.emailVerificationStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            LEAD_STATUSES.find(s => s.value === lead.status)?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Priority Score & Explainability */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                              isHigh
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isMed
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {lead.priorityScore}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] px-2 py-1 h-7 border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            icon={Sparkles}
                            onClick={() => setSelectedScoreLead(lead)}
                            title="Inspect 'Why this lead has this score' explainable factors"
                          >
                            Why this score?
                          </Button>
                        </div>
                      </td>

                      {/* Health State */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            LEAD_HEALTH_MAP[lead.leadHealth]?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {LEAD_HEALTH_MAP[lead.leadHealth]?.label || lead.leadHealth}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            icon={Eye}
                            title="View Lead Profile & Timeline"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => setDeletingLead(lead)}
                            icon={Trash2}
                            title="Delete Lead"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="border-t border-slate-200 px-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </Card>

      {/* Add New Lead Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New B2B Lead"
        subtitle="Automatic email verification & 0-100 priority scoring will execute upon creation."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Elena"
              value={newLead.firstName}
              onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Rostova"
              value={newLead.lastName}
              onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="elena@finscale.io"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+1-415-555-0192"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Name"
              placeholder="FinScale Payments"
              value={newLead.company}
              onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              required
            />
            <Input
              label="Job Title"
              placeholder="Chief Technology Officer"
              value={newLead.jobTitle}
              onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Industry"
              value={newLead.industry}
              onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
              options={INDUSTRIES}
            />

            <Select
              label="Company Size"
              value={newLead.companySize}
              onChange={(e) => setNewLead({ ...newLead, companySize: e.target.value })}
              options={COMPANY_SIZES}
            />

            <Select
              label="Lead Source"
              value={newLead.source}
              onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              options={SOURCES}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isCreating}>
              Create & Score Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Score Explanation Modal */}
      {selectedScoreLead && (
        <LeadScoreModal
          isOpen={!!selectedScoreLead}
          onClose={() => setSelectedScoreLead(null)}
          lead={selectedScoreLead}
        />
      )}

      {/* Delete Confirmation */}
      {deletingLead && (
        <ConfirmDialog
          isOpen={!!deletingLead}
          onClose={() => setDeletingLead(null)}
          onConfirm={handleDeleteLead}
          title="Delete Lead Record"
          message={`Are you sure you want to delete ${deletingLead.firstName} ${deletingLead.lastName} (${deletingLead.email})? This action removes all historical activities.`}
          confirmText="Delete Lead"
        />
      )}
    </div>
  );
}
