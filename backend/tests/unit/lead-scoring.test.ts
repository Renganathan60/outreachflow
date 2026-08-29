import { LeadScoringService } from '../../src/services/lead-scoring.service.js';
import { Lead, Activity } from '../../src/types/index.js';

describe('LeadScoringService (Unit Tests)', () => {
  it('should award 20 points for verified valid email', () => {
    const lead: Partial<Lead> = {
      emailVerificationStatus: 'VALID',
      jobTitle: 'Individual Contributor',
      companySize: '1-10',
      industry: 'Other',
      status: 'NEW'
    };
    const result = LeadScoringService.calculateScore(lead, []);
    expect(result.totalScore).toBe(20);
    expect(result.tier).toBe('LOW');
    expect(result.factors.find(f => f.factor === 'VALID_EMAIL')?.applied).toBe(true);
  });

  it('should award 25 points for executive decision-maker job titles (CEO, CTO, VP)', () => {
    const lead: Partial<Lead> = {
      emailVerificationStatus: 'UNKNOWN',
      jobTitle: 'Chief Technology Officer',
      companySize: '1-10',
      industry: 'Other',
      status: 'NEW'
    };
    const result = LeadScoringService.calculateScore(lead, []);
    expect(result.totalScore).toBe(25);
    expect(result.factors.find(f => f.factor === 'DECISION_MAKER_TITLE')?.applied).toBe(true);
  });

  it('should award 20 points for large enterprise company size (500+)', () => {
    const lead: Partial<Lead> = {
      emailVerificationStatus: 'UNKNOWN',
      jobTitle: 'Engineer',
      companySize: '500+',
      industry: 'Other',
      status: 'NEW'
    };
    const result = LeadScoringService.calculateScore(lead, []);
    expect(result.totalScore).toBe(20);
    expect(result.factors.find(f => f.factor === 'LARGE_ENTERPRISE')?.applied).toBe(true);
  });

  it('should calculate HIGH priority tier for high-intent engaged executive lead and cap at 100', () => {
    const lead: Partial<Lead> = {
      emailVerificationStatus: 'VALID', // +20
      jobTitle: 'Founder & CEO',        // +25
      companySize: '500+',             // +20
      industry: 'SaaS',                 // +10
      status: 'MEETING'                 // +25 (raw sum = 100)
    };

    const activities: Activity[] = [
      { id: '1', leadId: 'lead-1', type: 'EMAIL_OPENED', title: 'Opened', createdAt: new Date().toISOString() }, // +10
      { id: '2', leadId: 'lead-1', type: 'EMAIL_REPLIED', title: 'Replied', createdAt: new Date().toISOString() } // +25
    ];

    const result = LeadScoringService.calculateScore(lead, activities);
    // Raw sum would be 135, capped at 100
    expect(result.totalScore).toBe(100);
    expect(result.tier).toBe('HIGH');
    expect(result.factors.filter(f => f.applied).length).toBeGreaterThan(4);
  });

  it('should return LOW priority for unverified lead with generic title in small company', () => {
    const lead: Partial<Lead> = {
      emailVerificationStatus: 'UNKNOWN',
      jobTitle: 'Assistant',
      companySize: '1-10',
      industry: 'Traditional Retail',
      status: 'NEW'
    };
    const result = LeadScoringService.calculateScore(lead, []);
    expect(result.totalScore).toBe(0);
    expect(result.tier).toBe('LOW');
  });
});
