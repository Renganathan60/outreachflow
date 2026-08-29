import { CampaignGuardService } from '../../src/services/campaign-guard.service.js';
import { Lead, Campaign, CampaignLead } from '../../src/types/index.js';

describe('CampaignGuardService (Unit Tests)', () => {
  const activeCampaign: Campaign = {
    id: 'camp-1',
    name: 'Q3 Enterprise Outreach',
    status: 'ACTIVE',
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const pausedCampaign: Campaign = {
    ...activeCampaign,
    id: 'camp-2',
    name: 'Paused Outreach',
    status: 'PAUSED'
  };

  const validLead: Lead = {
    id: 'lead-1',
    firstName: 'Alex',
    lastName: 'Rivers',
    email: 'alex.rivers@cloudtech.com',
    company: 'CloudTech',
    jobTitle: 'VP Engineering',
    industry: 'Technology',
    companySize: '500+',
    source: 'LINKEDIN',
    status: 'NEW',
    priorityScore: 75,
    leadHealth: 'ACTIVE',
    emailVerificationStatus: 'VALID',
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('should pass validation for a valid active lead on an active campaign', () => {
    const result = CampaignGuardService.validateLeadForCampaign(validLead, activeCampaign);
    expect(result.eligible).toBe(true);
    expect(result.reasons.length).toBe(0);
  });

  it('should block lead when campaign is PAUSED or COMPLETED', () => {
    const result = CampaignGuardService.validateLeadForCampaign(validLead, pausedCampaign);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.includes('PAUSED'))).toBe(true);
  });

  it('should block lead with INVALID email verification status', () => {
    const invalidEmailLead: Lead = {
      ...validLead,
      emailVerificationStatus: 'INVALID'
    };
    const result = CampaignGuardService.validateLeadForCampaign(invalidEmailLead, activeCampaign);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.includes('INVALID'))).toBe(true);
  });

  it('should block lead marked as DO_NOT_CONTACT or NOT_INTERESTED', () => {
    const optOutLead: Lead = {
      ...validLead,
      leadHealth: 'DO_NOT_CONTACT'
    };
    const result = CampaignGuardService.validateLeadForCampaign(optOutLead, activeCampaign);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.includes('DO_NOT_CONTACT'))).toBe(true);
  });

  it('should block lead if already contacted by this specific campaign', () => {
    const existingEnrollment: CampaignLead = {
      id: 'enr-1',
      campaignId: activeCampaign.id,
      leadId: validLead.id,
      status: 'CONTACTED',
      enrolledAt: new Date().toISOString(),
      lastContactedAt: new Date().toISOString()
    };
    const result = CampaignGuardService.validateLeadForCampaign(validLead, activeCampaign, existingEnrollment);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some(r => r.includes('already been contacted'))).toBe(true);
  });

  it('should calculate batch validation metrics correctly', () => {
    const leads = [
      validLead,
      { ...validLead, id: 'lead-2', emailVerificationStatus: 'INVALID' as const },
      { ...validLead, id: 'lead-3', leadHealth: 'DO_NOT_CONTACT' as const }
    ];

    const batchResult = CampaignGuardService.validateBatch(leads, activeCampaign);
    expect(batchResult.totalEvaluated).toBe(3);
    expect(batchResult.eligibleLeads.length).toBe(1);
    expect(batchResult.blockedLeads.length).toBe(2);
    expect(batchResult.passRate).toBe(33);
  });
});
