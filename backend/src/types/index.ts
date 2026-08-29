// TypeScript Types & Enums for OutreachFlow

export type UserRole = 'ADMIN' | 'SALES_USER';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'MEETING'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'UNRESPONSIVE';

export type LeadSource =
  | 'LINKEDIN'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'IMPORT'
  | 'MANUAL';

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '500+';

export type LeadHealth =
  | 'ACTIVE'
  | 'NEEDS_FOLLOW_UP'
  | 'HIGH_INTENT'
  | 'UNRESPONSIVE'
  | 'DO_NOT_CONTACT';

export type EmailVerificationStatus =
  | 'VALID'
  | 'INVALID'
  | 'UNKNOWN';

export type PriorityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company: string;
  jobTitle: string;
  industry: string;
  companySize: CompanySize;
  source: LeadSource;
  status: LeadStatus;
  priorityScore: number;
  leadHealth: LeadHealth;
  emailVerificationStatus: EmailVerificationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreFactor {
  factor: string;
  points: number;
  description: string;
  applied: boolean;
}

export interface ScoreExplanation {
  totalScore: number;
  tier: PriorityTier;
  factors: ScoreFactor[];
  summary: string;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  leadCount?: number;
  stats?: CampaignStats;
}

export interface CampaignLead {
  id: string;
  campaignId: string;
  leadId: string;
  status: 'PENDING' | 'CONTACTED' | 'REPLIED' | 'CONVERTED' | 'OPTED_OUT';
  enrolledAt: string;
  lastContactedAt?: string | null;
  lead?: Lead;
}

export interface EmailSequence {
  id: string;
  campaignId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  steps?: EmailStep[];
}

export interface EmailStep {
  id: string;
  sequenceId: string;
  campaignId: string;
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'EMAIL_REPLIED'
  | 'FOLLOW_UP_SENT'
  | 'STATUS_CHANGED'
  | 'CAMPAIGN_ADDED'
  | 'CAMPAIGN_REMOVED'
  | 'MEETING_SCHEDULED';

export interface Activity {
  id: string;
  leadId: string;
  campaignId?: string | null;
  userId?: string | null;
  type: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface CampaignGuardResult {
  eligible: boolean;
  leadId: string;
  leadEmail: string;
  leadName: string;
  reasons: string[];
}

export interface CampaignStats {
  totalLeads: number;
  emailsSent: number;
  opened: number;
  replies: number;
  interested: number;
  meetings: number;
  converted: number;
  openRate: number;
  replyRate: number;
  interestRate: number;
  conversionRate: number;
}

export interface DashboardOverview {
  totalLeads: number;
  activeCampaigns: number;
  emailsSent: number;
  emailsOpened: number;
  replies: number;
  interestedLeads: number;
  meetingsScheduled: number;
  conversions: number;
  conversionRate: number;
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  healthDistribution: {
    active: number;
    needsFollowUp: number;
    highIntent: number;
    unresponsive: number;
    doNotContact: number;
  };
  recentActivities: Activity[];
  topPriorityLeads: Lead[];
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeadFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  industry?: string;
  source?: LeadSource;
  companySize?: CompanySize;
  emailVerificationStatus?: EmailVerificationStatus;
  leadHealth?: LeadHealth;
  priorityTier?: PriorityTier;
  sortBy?: 'createdAt' | 'priorityScore' | 'company' | 'status' | 'firstName';
  sortOrder?: 'ASC' | 'DESC';
}
