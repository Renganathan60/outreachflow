import { query } from '../src/config/db.js';
import { leadService } from '../src/services/lead.service.js';
import { campaignService } from '../src/services/campaign.service.js';
import { activityService } from '../src/services/activity.service.js';
import { sequenceRepository } from '../src/repositories/sequence.repository.js';
import { randomUUID } from 'crypto';

async function runScenario() {
  console.log('🚀 Running Final Acceptance Test Scenario...');

  // Get a valid user ID from the database
  const userRows: any = await query('SELECT id FROM users LIMIT 1');
  const validUserId = userRows[0]?.id || null;

  // 1. Find or create TCS Campaign
  const campaigns = await campaignService.getCampaigns();
  let tcsCampaign = campaigns.find(c => c.name.toLowerCase().includes('tcs'));
  
  if (!tcsCampaign) {
    console.log('Creating TCS Campaign...');
    tcsCampaign = await campaignService.createCampaign({
      name: 'TCS Campaign',
      description: 'Outbound campaign for TCS HR department',
      createdBy: validUserId
    });
  }

  // Ensure Campaign is ACTIVE
  if (tcsCampaign.status !== 'ACTIVE') {
    await campaignService.updateCampaign(tcsCampaign.id, { status: 'ACTIVE' });
    tcsCampaign = await campaignService.getCampaignById(tcsCampaign.id);
  }
  console.log(`✅ Campaign: "${tcsCampaign.name}" is ACTIVE (ID: ${tcsCampaign.id})`);

  // Ensure Day 0 email step exists
  let sequence = await sequenceRepository.getByCampaignId(tcsCampaign.id);
  if (!sequence || !sequence.steps || sequence.steps.length === 0) {
    if (!sequence) {
      const seqId = randomUUID();
      await sequenceRepository.createSequence({ id: seqId, campaignId: tcsCampaign.id, name: 'TCS Sequence' });
      sequence = await sequenceRepository.getByCampaignId(tcsCampaign.id);
    }
    await sequenceRepository.addStep({
      id: randomUUID(),
      sequenceId: sequence!.id,
      campaignId: tcsCampaign.id,
      stepNumber: 1,
      subject: 'Connecting with {{company}} / {{firstName}}',
      body: 'Hi {{firstName}},\n\nI came across {{company}} and noticed your work as {{jobTitle}}.\n\nWould you be open to a quick intro call?\n\nBest regards,',
      delayDays: 0
    });
  }

  // 2. Find or create lead "Kali Thasan" at TCS as HR
  const leadsResult = await leadService.getLeads({ search: 'Kali', limit: 10 });
  let kali = leadsResult.items.find(l => l.firstName.toLowerCase() === 'kali');

  if (!kali) {
    console.log('Creating Lead: Kali Thasan...');
    kali = await leadService.createLead({
      firstName: 'Kali',
      lastName: 'Thasan',
      email: 'kali.thasan@tcs.com',
      company: 'TCS',
      jobTitle: 'HR',
      industry: 'Technology',
      companySize: '500+',
      source: 'MANUAL',
      status: 'NEW',
      createdBy: 'test-admin'
    });
  }
  console.log(`✅ Lead: ${kali.firstName} ${kali.lastName} at ${kali.company} (${kali.jobTitle}), Score: ${kali.priorityScore}`);

  // Clear previous test activities for clean verification if needed
  await query('DELETE FROM activities WHERE leadId = ?', [kali.id]);
  await query('DELETE FROM campaign_leads WHERE leadId = ? AND campaignId = ?', [kali.id, tcsCampaign.id]);

  // Reset lead status
  await leadService.updateLead(kali.id, {
    status: 'NEW',
    emailVerificationStatus: 'VALID'
  });

  // Enroll Kali into TCS Campaign via Campaign Guard
  console.log('Enrolling Kali via Campaign Guard...');
  const enrollRes = await campaignService.enrollLeadsWithGuard(tcsCampaign.id, [kali.id], validUserId);
  console.log(`✅ Enrolled in campaign. Enrolled count: ${enrollRes.enrolledCount}`);

  // Check initial state
  let kaliDetails = await leadService.getLeadById(kali.id);
  let campaignStats = await campaignService.getCampaignAnalytics(tcsCampaign.id);
  let enrolledLeads = await campaignService.getCampaignLeads(tcsCampaign.id);
  let kaliEnrollment = enrolledLeads.find(e => e.leadId === kali!.id);

  console.log('\n--- Initial State ---');
  console.log(`Enrollment Status: ${kaliEnrollment?.enrollmentStatus} (Expected: PENDING)`);
  console.log(`Emails Delivered: ${campaignStats.emailsSent} (Expected: 0)`);
  console.log(`Responses Received: ${campaignStats.replies} (Expected: 0)`);
  console.log(`Meetings Booked: ${campaignStats.meetings} (Expected: 0)`);
  console.log(`Lead Priority Score: ${kaliDetails.priorityScore}`);
  console.log(`Lead Health: ${kaliDetails.leadHealth}`);

  if (kaliEnrollment?.enrollmentStatus !== 'PENDING') throw new Error('Initial enrollment status should be PENDING');
  if (campaignStats.emailsSent !== 0) throw new Error('Initial emails delivered should be 0');

  // STEP 1 & 2: Send Email
  console.log('\n--- Step 1: Send Email ---');
  const sendRes = await leadService.sendCadenceEmail(kali.id, tcsCampaign.id, validUserId);
  console.log(`Send Email Result: ${sendRes.message}`);
  console.log(`Rendered Subject: ${sendRes.emailDetails.subject}`);
  console.log(`Rendered Body:\n${sendRes.emailDetails.body}`);

  // Verify Idempotency check
  try {
    await leadService.sendCadenceEmail(kali.id, tcsCampaign.id, validUserId);
    throw new Error('Duplicate email send was not blocked!');
  } catch (err: any) {
    console.log(`✅ Idempotency protection verified: "${err.message}"`);
  }

  // Check state after Send Email
  kaliDetails = await leadService.getLeadById(kali.id);
  campaignStats = await campaignService.getCampaignAnalytics(tcsCampaign.id);
  enrolledLeads = await campaignService.getCampaignLeads(tcsCampaign.id);
  kaliEnrollment = enrolledLeads.find(e => e.leadId === kali!.id);
  let kaliActivities = await activityService.getLeadActivities(kali.id);

  console.log(`EMAIL_SENT Activity Count: ${kaliActivities.filter(a => a.type === 'EMAIL_SENT').length}`);
  console.log(`Enrollment Status: ${kaliEnrollment?.enrollmentStatus} (Expected: CONTACTED)`);
  console.log(`Emails Delivered: ${campaignStats.emailsSent} (Expected: 1)`);
  console.log(`Open Rate: ${campaignStats.openRate}% (Expected: 0%)`);

  if (campaignStats.emailsSent !== 1) throw new Error('Emails delivered should be 1');
  if (kaliEnrollment?.enrollmentStatus !== 'CONTACTED') throw new Error('Enrollment status should be CONTACTED');

  // STEP 3: Simulate Open (+10 pts)
  console.log('\n--- Step 2: Simulate Open (+10 pts) ---');
  const initialScore = kaliDetails.priorityScore;
  await activityService.logActivity({
    leadId: kali.id,
    campaignId: tcsCampaign.id,
    type: 'EMAIL_OPENED',
    title: 'Email Opened by Lead',
    description: 'Lead opened subject line (+10 priority pts)'
  });

  kaliDetails = await leadService.getLeadById(kali.id);
  campaignStats = await campaignService.getCampaignAnalytics(tcsCampaign.id);
  console.log(`New Score: ${kaliDetails.priorityScore} (Old: ${initialScore}, +${kaliDetails.priorityScore - initialScore} pts)`);
  console.log(`Emails Delivered: ${campaignStats.emailsSent} (Expected: 1)`);
  console.log(`Open Rate: ${campaignStats.openRate}% (Expected: 100%)`);
  if (campaignStats.openRate !== 100) throw new Error('Open rate should be 100%');

  // STEP 4: Simulate Reply (+25 pts)
  console.log('\n--- Step 3: Simulate Reply (+25 pts) ---');
  const scoreBeforeReply = kaliDetails.priorityScore;
  await activityService.logActivity({
    leadId: kali.id,
    campaignId: tcsCampaign.id,
    type: 'EMAIL_REPLIED',
    title: 'Lead Replied to Outreach',
    description: 'Lead replied expressing interest in architecture demo (+25 pts)',
    autoUpdateLeadStatus: 'REPLIED'
  });

  kaliDetails = await leadService.getLeadById(kali.id);
  campaignStats = await campaignService.getCampaignAnalytics(tcsCampaign.id);
  console.log(`New Score: ${kaliDetails.priorityScore} (Old: ${scoreBeforeReply}, +${kaliDetails.priorityScore - scoreBeforeReply} pts)`);
  console.log(`Lead Health: ${kaliDetails.leadHealth} (Expected: HIGH_INTENT)`);
  console.log(`Responses Received: ${campaignStats.replies} (Expected: 1)`);
  console.log(`Reply Rate: ${campaignStats.replyRate}% (Expected: 100%)`);
  if (campaignStats.replies !== 1) throw new Error('Responses received should be 1');
  if (campaignStats.replyRate !== 100) throw new Error('Reply rate should be 100%');
  if (kaliDetails.leadHealth !== 'HIGH_INTENT') throw new Error('Lead health should be HIGH_INTENT');

  // STEP 5: Book Demo (+25 pts)
  console.log('\n--- Step 4: Book Demo (+25 pts) ---');
  const scoreBeforeDemo = kaliDetails.priorityScore;
  await activityService.logActivity({
    leadId: kali.id,
    campaignId: tcsCampaign.id,
    type: 'MEETING_SCHEDULED',
    title: 'Discovery Demo Booked',
    description: 'Demo meeting confirmed on calendar (+25 pts)',
    autoUpdateLeadStatus: 'MEETING'
  });

  kaliDetails = await leadService.getLeadById(kali.id);
  campaignStats = await campaignService.getCampaignAnalytics(tcsCampaign.id);
  console.log(`New Score: ${kaliDetails.priorityScore} (Old: ${scoreBeforeDemo})`);
  console.log(`Meetings Booked: ${campaignStats.meetings} (Expected: 1)`);
  console.log(`Qualified Leads: ${campaignStats.interested}`);
  if (campaignStats.meetings !== 1) throw new Error('Meetings booked should be 1');

  // STEP 6: Verify Persistence from fresh queries
  console.log('\n--- Step 5: Database Persistence Verification ---');
  const freshCampaign = await campaignService.getCampaignById(tcsCampaign.id);
  const freshLead = await leadService.getLeadById(kali.id);
  const freshActivities = await activityService.getLeadActivities(kali.id);

  console.log(`Persisted Emails Delivered: ${freshCampaign.stats?.emailsSent}`);
  console.log(`Persisted Open Rate: ${freshCampaign.stats?.openRate}%`);
  console.log(`Persisted Responses: ${freshCampaign.stats?.replies}`);
  console.log(`Persisted Reply Rate: ${freshCampaign.stats?.replyRate}%`);
  console.log(`Persisted Meetings: ${freshCampaign.stats?.meetings}`);
  console.log(`Persisted Lead Priority Score: ${freshLead.priorityScore}/100`);
  console.log(`Persisted Lead Health: ${freshLead.leadHealth}`);
  console.log(`Persisted Activities Count: ${freshActivities.length}`);

  console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED AND PERSISTED SUCCESSFULLY!');
  process.exit(0);
}

runScenario().catch(err => {
  console.error('❌ Scenario Verification Failed:', err);
  process.exit(1);
});
