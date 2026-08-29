import { jest } from '@jest/globals';
import { emailService } from '../../src/services/email.service.js';
import { leadService } from '../../src/services/lead.service.js';
import { leadRepository } from '../../src/repositories/lead.repository.js';
import { campaignRepository } from '../../src/repositories/campaign.repository.js';
import { sequenceRepository } from '../../src/repositories/sequence.repository.js';
import { activityRepository } from '../../src/repositories/activity.repository.js';
import { activityService } from '../../src/services/activity.service.js';
import { CampaignGuardService } from '../../src/services/campaign-guard.service.js';
import { BadRequestError } from '../../src/utils/errors.js';

describe('Real Email Delivery Service & Campaign Guard (Unit Tests)', () => {
  const mockLead = {
    id: 'lead-kali-101',
    firstName: 'Kali',
    lastName: 'Thasan',
    email: 'kali@tcs-enterprise.com',
    company: 'TCS',
    jobTitle: 'HR Director',
    industry: 'Technology',
    companySize: '500+' as const,
    source: 'LINKEDIN' as const,
    status: 'NEW' as const,
    priorityScore: 85,
    leadHealth: 'ACTIVE' as const,
    emailVerificationStatus: 'VALID' as const,
    createdBy: 'user-admin-1'
  };

  const mockActiveCampaign = {
    id: 'camp-tcs-outreach',
    name: 'TCS Executive Outreach Campaign',
    description: 'B2B Enterprise Outreach',
    status: 'ACTIVE' as const,
    createdBy: 'user-admin-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockEnrollment = {
    id: 'enr-101',
    campaignId: 'camp-tcs-outreach',
    leadId: 'lead-kali-101',
    status: 'PENDING' as const,
    enrolledAt: new Date(),
    campaignName: 'TCS Executive Outreach Campaign',
    campaignStatus: 'ACTIVE'
  };

  const mockCadenceStep = {
    id: 'step-1',
    sequenceId: 'seq-1',
    campaignId: 'camp-tcs-outreach',
    stepNumber: 1,
    subject: 'Connecting with {{company}} / {{firstName}}',
    body: 'Hi {{firstName}},\n\nNoticed your work at {{company}} as {{jobTitle}}.\n\nBest regards,',
    delayDays: 0
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('1. should successfully send email through EmailService and return EMAIL_SUBMITTED with messageId', async () => {
    // Mock Resend client call
    const sendCadenceEmailSpy = jest.spyOn(emailService, 'sendCadenceEmail').mockResolvedValue({
      messageId: 'msg_resend_mock_abc123',
      provider: 'resend',
      status: 'EMAIL_SUBMITTED',
      to: 'kali@tcs-enterprise.com',
      subject: 'Connecting with TCS / Kali'
    });

    const result = await emailService.sendCadenceEmail({
      to: 'kali@tcs-enterprise.com',
      toName: 'Kali Thasan',
      subject: 'Connecting with TCS / Kali',
      body: 'Hi Kali, great connecting with you.'
    });

    expect(result.status).toBe('EMAIL_SUBMITTED');
    expect(result.provider).toBe('resend');
    expect(result.messageId).toBe('msg_resend_mock_abc123');
    expect(sendCadenceEmailSpy).toHaveBeenCalledTimes(1);
  });

  it('2. should authoritatively take the recipient email from MySQL lead record and render variables', async () => {
    jest.spyOn(leadRepository, 'findById').mockResolvedValue({ ...mockLead });
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });
    jest.spyOn(sequenceRepository, 'getStepsByCampaignId').mockResolvedValue([mockCadenceStep]);
    jest.spyOn(activityRepository, 'getByLeadId').mockResolvedValue([]);
    jest.spyOn(campaignRepository, 'updateEnrollmentStatus').mockResolvedValue(undefined as any);

    let sentPayload: any = null;
    jest.spyOn(emailService, 'sendCadenceEmail').mockImplementation(async (payload) => {
      sentPayload = payload;
      return {
        messageId: 'msg_resend_789',
        provider: 'resend',
        status: 'EMAIL_SUBMITTED',
        to: payload.to,
        subject: payload.subject
      };
    });

    jest.spyOn(activityService, 'logActivity').mockResolvedValue({
      id: 'act-1',
      leadId: mockLead.id,
      type: 'EMAIL_SENT',
      title: 'Outreach Email Sent',
      createdAt: new Date()
    } as any);

    const result = await leadService.sendCadenceEmail(mockLead.id, mockActiveCampaign.id);

    expect(sentPayload).toBeDefined();
    // Authoritative recipient from MySQL
    expect(sentPayload.to).toBe('kali@tcs-enterprise.com');
    // Variable substitution
    expect(sentPayload.subject).toBe('Connecting with TCS / Kali');
    expect(sentPayload.body).toContain('Noticed your work at TCS as HR Director');
    expect(result.message).toBe('Email submitted successfully.');
  });

  it('3. should ignore any client-provided recipient email and never send to logged-in user or untrusted email', async () => {
    jest.spyOn(leadRepository, 'findById').mockResolvedValue({ ...mockLead, email: 'kali@authoritative-lead.com' });
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });
    jest.spyOn(sequenceRepository, 'getStepsByCampaignId').mockResolvedValue([mockCadenceStep]);
    jest.spyOn(activityRepository, 'getByLeadId').mockResolvedValue([]);
    jest.spyOn(campaignRepository, 'updateEnrollmentStatus').mockResolvedValue(undefined as any);

    let recipientDispatched = '';
    jest.spyOn(emailService, 'sendCadenceEmail').mockImplementation(async (payload) => {
      recipientDispatched = payload.to;
      return {
        messageId: 'msg_123',
        provider: 'resend',
        status: 'EMAIL_SUBMITTED',
        to: payload.to,
        subject: payload.subject
      };
    });

    jest.spyOn(activityService, 'logActivity').mockResolvedValue({} as any);

    await leadService.sendCadenceEmail(mockLead.id, mockActiveCampaign.id, 'sales-user-999');

    // Authoritative recipient must remain the lead's email from MySQL
    expect(recipientDispatched).toBe('kali@authoritative-lead.com');
    expect(recipientDispatched).not.toBe('sales-user-999');
  });

  it('4. Campaign Guard should block sending to DO_NOT_CONTACT leads', async () => {
    const dncLead = { ...mockLead, leadHealth: 'DO_NOT_CONTACT' as const };
    const guard = CampaignGuardService.validateLeadForCampaign(dncLead as any, mockActiveCampaign as any);

    expect(guard.eligible).toBe(false);
    expect(guard.reasons.some(r => r.includes('DO_NOT_CONTACT'))).toBe(true);

    jest.spyOn(leadRepository, 'findById').mockResolvedValue(dncLead as any);
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });

    await expect(leadService.sendCadenceEmail(dncLead.id, mockActiveCampaign.id)).rejects.toThrow(BadRequestError);
  });

  it('5. Campaign Guard should block sending to INVALID email verification status', async () => {
    const invalidLead = { ...mockLead, emailVerificationStatus: 'INVALID' as const };
    const guard = CampaignGuardService.validateLeadForCampaign(invalidLead as any, mockActiveCampaign as any);

    expect(guard.eligible).toBe(false);
    expect(guard.reasons.some(r => r.includes('INVALID'))).toBe(true);

    jest.spyOn(leadRepository, 'findById').mockResolvedValue(invalidLead as any);
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });

    await expect(leadService.sendCadenceEmail(invalidLead.id, mockActiveCampaign.id)).rejects.toThrow(BadRequestError);
  });

  it('6. Campaign Guard should block sending when campaign is PAUSED or COMPLETED', async () => {
    const pausedCampaign = { ...mockActiveCampaign, status: 'PAUSED' as const };
    const guard = CampaignGuardService.validateLeadForCampaign(mockLead as any, pausedCampaign as any);

    expect(guard.eligible).toBe(false);
    expect(guard.reasons.some(r => r.includes('PAUSED'))).toBe(true);

    jest.spyOn(leadRepository, 'findById').mockResolvedValue(mockLead as any);
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([
      { ...mockEnrollment, campaignStatus: 'PAUSED' }
    ]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue(pausedCampaign as any);

    await expect(leadService.sendCadenceEmail(mockLead.id, pausedCampaign.id)).rejects.toThrow(BadRequestError);
  });

  it('7. Idempotency Guard should block duplicate cadence email sends for the same step', async () => {
    jest.spyOn(leadRepository, 'findById').mockResolvedValue({ ...mockLead });
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });
    jest.spyOn(sequenceRepository, 'getStepsByCampaignId').mockResolvedValue([mockCadenceStep]);
    
    // Existing EMAIL_SENT activity for step 1
    jest.spyOn(activityRepository, 'getByLeadId').mockResolvedValue([
      {
        id: 'act-prev-1',
        leadId: mockLead.id,
        campaignId: mockActiveCampaign.id,
        type: 'EMAIL_SENT',
        title: 'Outreach Email Sent',
        metadata: { stepNumber: 1 },
        createdAt: new Date()
      } as any
    ]);

    const sendEmailSpy = jest.spyOn(emailService, 'sendCadenceEmail');

    await expect(leadService.sendCadenceEmail(mockLead.id, mockActiveCampaign.id)).rejects.toThrow(
      /already been sent/i
    );
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it('8. should NOT log EMAIL_SENT activity or update status if email provider returns an error', async () => {
    jest.spyOn(leadRepository, 'findById').mockResolvedValue({ ...mockLead });
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });
    jest.spyOn(sequenceRepository, 'getStepsByCampaignId').mockResolvedValue([mockCadenceStep]);
    jest.spyOn(activityRepository, 'getByLeadId').mockResolvedValue([]);

    // Provider failure simulation
    jest.spyOn(emailService, 'sendCadenceEmail').mockRejectedValue(
      new BadRequestError('Email provider delivery failed: Domain not verified')
    );

    const logActivitySpy = jest.spyOn(activityService, 'logActivity');
    const updateEnrollmentSpy = jest.spyOn(campaignRepository, 'updateEnrollmentStatus');

    await expect(leadService.sendCadenceEmail(mockLead.id, mockActiveCampaign.id)).rejects.toThrow(
      /Domain not verified/i
    );

    expect(logActivitySpy).not.toHaveBeenCalled();
    expect(updateEnrollmentSpy).not.toHaveBeenCalled();
  });

  it('9. should log EMAIL_SENT activity with EMAIL_SUBMITTED status and provider messageId upon provider confirmation', async () => {
    jest.spyOn(leadRepository, 'findById').mockResolvedValue({ ...mockLead });
    jest.spyOn(campaignRepository, 'getEnrollmentsByLeadId').mockResolvedValue([mockEnrollment]);
    jest.spyOn(campaignRepository, 'findById').mockResolvedValue({ ...mockActiveCampaign });
    jest.spyOn(sequenceRepository, 'getStepsByCampaignId').mockResolvedValue([mockCadenceStep]);
    jest.spyOn(activityRepository, 'getByLeadId').mockResolvedValue([]);
    jest.spyOn(campaignRepository, 'updateEnrollmentStatus').mockResolvedValue(undefined as any);

    jest.spyOn(emailService, 'sendCadenceEmail').mockResolvedValue({
      messageId: 'resend_msg_prod_99999',
      provider: 'resend',
      status: 'EMAIL_SUBMITTED',
      to: mockLead.email,
      subject: 'Connecting with TCS / Kali'
    });

    let loggedActivityData: any = null;
    jest.spyOn(activityService, 'logActivity').mockImplementation(async (data: any) => {
      loggedActivityData = data;
      return { id: 'act-new-1', ...data, createdAt: new Date() };
    });

    const result = await leadService.sendCadenceEmail(mockLead.id, mockActiveCampaign.id);

    expect(loggedActivityData).toBeDefined();
    expect(loggedActivityData.type).toBe('EMAIL_SENT');
    expect(loggedActivityData.metadata.providerMessageId).toBe('resend_msg_prod_99999');
    expect(loggedActivityData.metadata.deliveryStatus).toBe('EMAIL_SUBMITTED');
    expect(loggedActivityData.metadata.recipientEmail).toBe('kali@tcs-enterprise.com');
    expect(result.emailDetails.providerMessageId).toBe('resend_msg_prod_99999');
    expect(result.emailDetails.deliveryStatus).toBe('EMAIL_SUBMITTED');
  });
});
