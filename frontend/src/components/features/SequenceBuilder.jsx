import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Clock, Sparkles, Send, Eye } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Modal from '../common/Modal.jsx';
import { campaignService } from '../../services/campaignService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SequenceBuilder({ campaignId, sequence, onSequenceUpdated }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayDays, setDelayDays] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  const { success, error } = useToast();

  const steps = sequence?.steps || [];

  const handleOpenAddModal = () => {
    setEditingStep(null);
    setSubject('');
    setBody('Hi {{firstName}},\n\nFollowing up regarding {{company}}...\n\nBest regards,');
    setDelayDays(steps.length === 0 ? 0 : 3);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (step) => {
    setEditingStep(step);
    setSubject(step.subject);
    setBody(step.body);
    setDelayDays(step.delayDays);
    setIsAddModalOpen(true);
  };

  const handleInsertVariable = (variable) => {
    setBody((prev) => prev + ` {{${variable}}}`);
  };

  const handleSaveStep = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      error('Subject and body are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStep) {
        await campaignService.updateSequenceStep(campaignId, editingStep.id, {
          subject,
          body,
          delayDays: Number(delayDays)
        });
        success('Sequence step updated successfully');
      } else {
        await campaignService.addSequenceStep(campaignId, {
          subject,
          body,
          delayDays: Number(delayDays)
        });
        success('New sequence step added');
      }
      setIsAddModalOpen(false);
      if (onSequenceUpdated) onSequenceUpdated();
    } catch (err) {
      error(err.message || 'Failed to save sequence step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!confirm('Are you sure you want to delete this cadence step?')) return;
    try {
      await campaignService.deleteSequenceStep(campaignId, stepId);
      success('Sequence step removed');
      if (onSequenceUpdated) onSequenceUpdated();
    } catch (err) {
      error(err.message || 'Failed to delete step');
    }
  };

  const renderSamplePreview = (text) => {
    return text
      .replace(/\{\{firstName\}\}/g, 'Alex')
      .replace(/\{\{lastName\}\}/g, 'Rivers')
      .replace(/\{\{company\}\}/g, 'Acme Corp')
      .replace(/\{\{jobTitle\}\}/g, 'VP Engineering')
      .replace(/\{\{industry\}\}/g, 'SaaS');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {sequence?.name || 'Email Outreach Cadence'}
          </h3>
          <p className="text-xs text-slate-500">
            Configure multi-step cadence sequence and follow-up delays.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddModal} icon={Plus}>
          Add Cadence Step
        </Button>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
            No steps configured for this campaign sequence yet. Click "Add Cadence Step" to create one.
          </div>
        ) : (
          steps.map((step) => (
            <div
              key={step.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                    #{step.stepNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {step.delayDays === 0 ? 'Day 0 (Initial Email)' : `Day +${step.delayDays} Follow-up`}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{step.subject}</h4>
                    <p className="text-xs text-slate-600 mt-2 whitespace-pre-line line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                      {step.body}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewStep(step)}
                    icon={Eye}
                    title="Preview with sample lead variables"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(step)}
                    icon={Edit3}
                    title="Edit Step"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => handleDeleteStep(step.id)}
                    icon={Trash2}
                    title="Delete Step"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Step Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStep ? `Edit Cadence Step #${editingStep.stepNumber}` : 'Add Cadence Follow-Up Step'}
        subtitle="Specify email subject, cadence delay, and dynamic personalized variables."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveStep} className="space-y-4">
          <Input
            label="Subject Line"
            placeholder="e.g. Quick question regarding {{company}}'s outbound infrastructure"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Cadence Delay (Days After Previous Step)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="60"
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
                className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-xs text-slate-500">
                {Number(delayDays) === 0 ? 'Sends immediately (Initial outreach)' : `Wait ${delayDays} days before sending`}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Message Body
              </label>
              <div className="flex items-center gap-1">
                {['firstName', 'company', 'jobTitle', 'industry'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  >
                    + {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs shadow-xs"
              placeholder="Hi {{firstName}}, ..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingStep ? 'Update Step' : 'Add Step to Cadence'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Step Modal */}
      {previewStep && (
        <Modal
          isOpen={!!previewStep}
          onClose={() => setPreviewStep(null)}
          title={`Cadence Preview: Step #${previewStep.stepNumber}`}
          subtitle="Sample rendered output with personalized lead attributes"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Subject: </span>
              <span className="text-slate-900 font-bold">{renderSamplePreview(previewStep.subject)}</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-line font-sans leading-relaxed shadow-xs">
              {renderSamplePreview(previewStep.body)}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewStep(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
