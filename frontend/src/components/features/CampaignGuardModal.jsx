import React from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function CampaignGuardModal({
  isOpen,
  onClose,
  campaign,
  previewData,
  onConfirmEnroll,
  isSubmitting = false,
}) {
  if (!isOpen || !previewData) return null;

  const { eligibleLeads = [], blockedLeads = [], totalEvaluated = 0, passRate = 0 } = previewData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Guard Deliverability & Safety Screening"
      subtitle={`Pre-outreach validation for campaign "${campaign?.name}"`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Pass / Block Summary Banner */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <p className="text-xs font-semibold text-slate-600">Total Evaluated</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalEvaluated}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <p className="text-xs font-semibold text-emerald-700">Eligible to Enroll</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{eligibleLeads.length}</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <p className="text-xs font-semibold text-rose-700">Blocked by Safety</p>
            <p className="text-2xl font-black text-rose-700 mt-1">{blockedLeads.length}</p>
          </div>
        </div>

        {/* Deliverability Health Pill */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">Domain Deliverability Pass Rate:</span>
          </div>
          <span className="font-black text-sm text-indigo-700">{passRate}% Pass Rate</span>
        </div>

        {/* Blocked Leads Section */}
        {blockedLeads.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Blocked Leads ({blockedLeads.length}) — Campaign Guard Protection Active
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {blockedLeads.map(({ lead, reasons }, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900">{lead.firstName} {lead.lastName}</span>{' '}
                    <span className="text-slate-500">({lead.email})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reasons.map((r, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eligible Leads Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Eligible Leads Ready for Enrollment ({eligibleLeads.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {eligibleLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-800">{lead.firstName} {lead.lastName}</span>{' '}
                  <span className="text-slate-500">({lead.company} • {lead.email})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Passed All Checks
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={onConfirmEnroll}
            isLoading={isSubmitting}
            disabled={eligibleLeads.length === 0}
            icon={ShieldCheck}
          >
            Enroll {eligibleLeads.length} Verified Leads
          </Button>
        </div>
      </div>
    </Modal>
  );
}
