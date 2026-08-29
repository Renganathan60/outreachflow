export const LEAD_STATUSES = [
  { value: 'NEW', label: 'New', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'REPLIED', label: 'Replied', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'INTERESTED', label: 'Interested', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'MEETING', label: 'Meeting Booked', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'CONVERTED', label: 'Converted', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export const LEAD_HEALTH_MAP = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  NEEDS_FOLLOW_UP: { label: 'Needs Follow-up', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH_INTENT: { label: 'High Intent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  UNRESPONSIVE: { label: 'Unresponsive', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  DO_NOT_CONTACT: { label: 'Do Not Contact', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const PRIORITY_TIERS = {
  HIGH: { min: 80, label: 'High Priority', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600' },
  MEDIUM: { min: 50, label: 'Medium Priority', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  LOW: { min: 0, label: 'Low Priority', badge: 'bg-slate-100 text-slate-600 border-slate-200', text: 'text-slate-500' },
};

export const EMAIL_VERIFICATION_MAP = {
  VALID: { label: 'Verified Valid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INVALID: { label: 'Invalid / Undeliverable', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  UNKNOWN: { label: 'Unverified', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const CAMPAIGN_STATUS_MAP = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAUSED: { label: 'Paused', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export const INDUSTRIES = [
  'Technology',
  'SaaS',
  'Fintech',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Cybersecurity',
  'Artificial Intelligence',
  'Cloud Computing',
  'Logistics',
  'Design',
  'Media',
  'Renewables'
];

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export const SOURCES = ['LINKEDIN', 'WEBSITE', 'REFERRAL', 'IMPORT', 'MANUAL'];
