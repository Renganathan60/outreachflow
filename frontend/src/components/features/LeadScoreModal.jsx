import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import { leadService } from '../../services/leadService.js';
import { CheckCircle2, XCircle, Sparkles, HelpCircle, ShieldCheck } from 'lucide-react';
import { PRIORITY_TIERS } from '../../utils/constants.js';

export default function LeadScoreModal({ isOpen, onClose, lead }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead?.id) {
      setLoading(true);
      leadService
        .getScoreExplanation(lead.id)
        .then((data) => setExplanation(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const score = explanation?.totalScore ?? lead.priorityScore ?? 0;
  const tier = explanation?.tier || (score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW');
  const tierMeta = PRIORITY_TIERS[tier];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transparent Lead Prioritization Breakdown"
      subtitle={`Explainable scoring model for ${lead.firstName} ${lead.lastName} (${lead.company})`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Score Top Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-2xl font-black">{score}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-100">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900">{tierMeta.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tierMeta.badge}`}>
                  {tier}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Deterministic rule-based scoring engine (no black-box AI).
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-500">Score Tier</p>
            <p className="text-sm font-bold text-slate-800">{score >= 80 ? 'Immediate Outreach' : score >= 50 ? 'Nurture Stream' : 'Low Velocity'}</p>
          </div>
        </div>

        {/* Breakdown List: "Why this lead has this score" */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Why this lead received this score:
          </h4>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Computing real-time explainability factors...</div>
          ) : (
            <div className="space-y-2.5">
              {explanation?.factors?.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    f.applied
                      ? 'bg-indigo-50/40 border-indigo-100 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {f.applied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${f.applied ? 'text-slate-900' : 'text-slate-400'}`}>
                        {f.description}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Factor: <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">{f.factor}</code></p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${
                        f.applied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {f.applied ? `+${f.points} pts` : '0 pts'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scoring Philosophy Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            The scoring algorithm transparently adds points for deliverable corporate emails (+20), senior decision makers (+25), enterprise scale companies (+20), target industries (+10), and verified engagement (+25 for replies). Maximum score is strictly capped at 100.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Inspection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
