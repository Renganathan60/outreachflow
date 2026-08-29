import { Lead, ScoreExplanation, ScoreFactor, PriorityTier, Activity } from '../types/index.js';

export class LeadScoringService {
  private static readonly EXECUTIVE_TITLES = [
    'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cro', 'cio',
    'founder', 'co-founder', 'president', 'vp', 'vice president',
    'head of', 'director', 'managing director', 'chief'
  ];

  private static readonly HIGH_VALUE_INDUSTRIES = [
    'technology', 'saas', 'software', 'fintech', 'finance',
    'healthcare', 'e-commerce', 'ecommerce', 'artificial intelligence', 'ai',
    'cybersecurity', 'cloud computing', 'enterprise software'
  ];

  /**
   * Calculates the priority score (0-100) and an explainable breakdown for a lead.
   *
   * Rules:
   * 1. Valid Email: +20 pts
   * 2. Senior Decision Maker Title (CEO/CTO/VP/Director): +25 pts
   * 3. Enterprise / Scale Company Size (500+: +20, 201-500: +15, 51-200: +10)
   * 4. High-Growth / Tech Target Industry: +10 pts
   * 5. Email Opened: +10 pts
   * 6. Email Replied: +25 pts
   * 7. Lead Marked Interested: +20 pts
   * 8. Meeting Scheduled: +25 pts
   *
   * Max Cap: 100 points
   */
  public static calculateScore(lead: Partial<Lead>, activities: Activity[] = []): ScoreExplanation {
    const factors: ScoreFactor[] = [];
    let rawScore = 0;

    // Factor 1: Email Verification
    const isEmailValid = lead.emailVerificationStatus === 'VALID';
    if (isEmailValid) {
      rawScore += 20;
      factors.push({
        factor: 'VALID_EMAIL',
        points: 20,
        description: 'Verified deliverable email address',
        applied: true
      });
    } else if (lead.emailVerificationStatus === 'INVALID') {
      factors.push({
        factor: 'INVALID_EMAIL',
        points: 0,
        description: 'Email is invalid or undeliverable',
        applied: false
      });
    }

    // Factor 2: Job Title Seniority
    const titleLower = (lead.jobTitle || '').toLowerCase().trim();
    const isDecisionMaker = this.EXECUTIVE_TITLES.some(title => titleLower.includes(title));
    if (isDecisionMaker) {
      rawScore += 25;
      factors.push({
        factor: 'DECISION_MAKER_TITLE',
        points: 25,
        description: `High-value decision maker role (${lead.jobTitle})`,
        applied: true
      });
    }

    // Factor 3: Company Size
    if (lead.companySize === '500+') {
      rawScore += 20;
      factors.push({
        factor: 'LARGE_ENTERPRISE',
        points: 20,
        description: 'Enterprise company tier (500+ employees)',
        applied: true
      });
    } else if (lead.companySize === '201-500') {
      rawScore += 15;
      factors.push({
        factor: 'MID_MARKET',
        points: 15,
        description: 'Mid-market company tier (201-500 employees)',
        applied: true
      });
    } else if (lead.companySize === '51-200') {
      rawScore += 10;
      factors.push({
        factor: 'GROWTH_COMPANY',
        points: 10,
        description: 'Growth-stage company (51-200 employees)',
        applied: true
      });
    }

    // Factor 4: High-Value Industry
    const industryLower = (lead.industry || '').toLowerCase().trim();
    const industryWords = industryLower.split(/[\s,/-]+/);
    const isRelevantIndustry = this.HIGH_VALUE_INDUSTRIES.some(ind => {
      if (ind === 'ai') {
        return industryWords.includes('ai') || industryLower.includes('artificial intelligence');
      }
      return industryLower.includes(ind);
    });
    if (isRelevantIndustry) {
      rawScore += 10;
      factors.push({
        factor: 'TARGET_INDUSTRY',
        points: 10,
        description: `Target high-growth industry (${lead.industry})`,
        applied: true
      });
    }

    // Factor 5 & 6: Activity History (Email Opened, Replied, Meeting)
    const hasOpened = activities.some(a => a.type === 'EMAIL_OPENED');
    const hasReplied = activities.some(a => a.type === 'EMAIL_REPLIED') || lead.status === 'REPLIED';
    const hasMeeting = activities.some(a => a.type === 'MEETING_SCHEDULED') || lead.status === 'MEETING';

    if (hasOpened) {
      rawScore += 10;
      factors.push({
        factor: 'EMAIL_OPENED',
        points: 10,
        description: 'Lead opened campaign outreach email',
        applied: true
      });
    }

    if (hasReplied) {
      rawScore += 25;
      factors.push({
        factor: 'EMAIL_REPLIED',
        points: 25,
        description: 'Lead actively engaged and replied to outreach',
        applied: true
      });
    }

    // Factor 7: Interested Status
    if (lead.status === 'INTERESTED') {
      rawScore += 20;
      factors.push({
        factor: 'HIGH_INTEREST',
        points: 20,
        description: 'Lead confirmed positive purchase or demo intent',
        applied: true
      });
    }

    // Factor 8: Meeting Scheduled
    if (hasMeeting) {
      rawScore += 25;
      factors.push({
        factor: 'MEETING_BOOKED',
        points: 25,
        description: 'Demo or discovery meeting booked',
        applied: true
      });
    }

    // Hard cap score at 100
    const totalScore = Math.min(100, Math.max(0, rawScore));
    const tier = this.getTier(totalScore);

    const appliedCount = factors.filter(f => f.applied).length;
    const summary = `${tier} Priority (${totalScore}/100) based on ${appliedCount} qualifying criteria.`;

    return {
      totalScore,
      tier,
      factors,
      summary
    };
  }

  public static getTier(score: number): PriorityTier {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }
}
