import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
const uuidv4 = randomUUID;
import { query, withTransaction } from '../config/db.js';
import { LeadScoringService } from '../services/lead-scoring.service.js';
import { LeadHealthService } from '../services/lead-health.service.js';
import { Lead, Activity, LeadStatus, LeadSource, CompanySize, EmailVerificationStatus } from '../types/index.js';

// Simple UUID fallback generator if uuid package is not loaded
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatMysqlDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function seedDatabase() {
  console.log('🌱 Starting database seeding for OutreachFlow...');

  // 1. Clean existing records in relational dependency order
  console.log('🧹 Cleaning existing records...');
  await query('SET FOREIGN_KEY_CHECKS = 0;');
  await query('TRUNCATE TABLE activities;');
  await query('TRUNCATE TABLE email_steps;');
  await query('TRUNCATE TABLE email_sequences;');
  await query('TRUNCATE TABLE campaign_leads;');
  await query('TRUNCATE TABLE campaigns;');
  await query('TRUNCATE TABLE leads;');
  await query('TRUNCATE TABLE users;');
  await query('SET FOREIGN_KEY_CHECKS = 1;');

  // 2. Create Users
  console.log('👤 Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = {
    id: generateId(),
    name: 'Admin Director',
    email: 'admin@outreachflow.com',
    passwordHash,
    role: 'ADMIN'
  };

  const salesUser1 = {
    id: generateId(),
    name: 'Sarah Connor',
    email: 'sarah.sales@outreachflow.com',
    passwordHash,
    role: 'SALES_USER'
  };

  const salesUser2 = {
    id: generateId(),
    name: 'Alex Mercer',
    email: 'alex.outreach@outreachflow.com',
    passwordHash,
    role: 'SALES_USER'
  };

  for (const u of [adminUser, salesUser1, salesUser2]) {
    await query(
      'INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.passwordHash, u.role]
    );
  }
  console.log('✅ 3 Users seeded (admin@outreachflow.com, sarah.sales@outreachflow.com, alex.outreach@outreachflow.com)');

  // 3. Create Raw Leads Data
  console.log('🎯 Seeding 35+ realistic B2B leads...');

  const rawLeadsData: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    industry: string;
    companySize: CompanySize;
    source: LeadSource;
    status: LeadStatus;
    emailVerificationStatus: EmailVerificationStatus;
    createdBy: string;
  }> = [
    {
      firstName: 'Satya',
      lastName: 'Nadella',
      email: 'satya@techcorp-cloud.com',
      phone: '+1-425-555-0100',
      company: 'TechCorp Cloud',
      jobTitle: 'Chief Executive Officer',
      industry: 'Technology',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'MEETING',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@finscale.io',
      phone: '+1-415-555-0192',
      company: 'FinScale Payments',
      jobTitle: 'Chief Technology Officer',
      industry: 'Fintech',
      companySize: '500+',
      source: 'WEBSITE',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@cyberguard-sec.com',
      phone: '+1-650-555-0144',
      company: 'CyberGuard Security',
      jobTitle: 'VP of Engineering',
      industry: 'Cybersecurity',
      companySize: '201-500',
      source: 'LINKEDIN',
      status: 'REPLIED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Devon',
      lastName: 'Miles',
      email: 'devon@datastream-flow.io',
      phone: '+1-512-555-0188',
      company: 'DataStream Flow',
      jobTitle: 'Founder & CEO',
      industry: 'SaaS',
      companySize: '51-200',
      source: 'REFERRAL',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@healthvibe-ai.com',
      phone: '+1-212-555-0132',
      company: 'HealthVibe AI',
      jobTitle: 'Chief Product Officer',
      industry: 'Healthcare',
      companySize: '201-500',
      source: 'IMPORT',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Lucas',
      lastName: 'Dubois',
      email: 'lucas.d@cloudmatrix-ops.net',
      phone: '+1-312-555-0112',
      company: 'CloudMatrix Ops',
      jobTitle: 'VP of Cloud Infrastructure',
      industry: 'Cloud Computing',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'CONVERTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Aaliyah',
      lastName: 'Patel',
      email: 'aaliyah@nexustrade-commerce.com',
      phone: '+1-206-555-0199',
      company: 'NexusTrade Commerce',
      jobTitle: 'Head of Growth Marketing',
      industry: 'E-commerce',
      companySize: '51-200',
      source: 'WEBSITE',
      status: 'REPLIED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Benjamin',
      lastName: 'Hayes',
      email: 'ben.hayes@blockvault-fin.io',
      phone: '+1-617-555-0155',
      company: 'BlockVault Financial',
      jobTitle: 'Managing Director',
      industry: 'Finance',
      companySize: '500+',
      source: 'REFERRAL',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Chloe',
      lastName: 'Zhao',
      email: 'chloe.z@synthetix-ai.org',
      phone: '+1-408-555-0177',
      company: 'Synthetix Neural AI',
      jobTitle: 'Chief AI Scientist',
      industry: 'Artificial Intelligence',
      companySize: '51-200',
      source: 'LINKEDIN',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'James',
      lastName: 'O\'Connor',
      email: 'james.oc@retailscale-solutions.com',
      phone: '+1-704-555-0166',
      company: 'RetailScale Solutions',
      jobTitle: 'Director of Business Development',
      industry: 'E-commerce',
      companySize: '201-500',
      source: 'MANUAL',
      status: 'NEW',
      emailVerificationStatus: 'UNKNOWN',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Tara',
      lastName: 'Kowalski',
      email: 'tara@pulsemed-devices.com',
      phone: '+1-612-555-0144',
      company: 'PulseMed Devices',
      jobTitle: 'VP Quality & Regulatory',
      industry: 'Healthcare',
      companySize: '201-500',
      source: 'IMPORT',
      status: 'UNRESPONSIVE',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Siddharth',
      lastName: 'Verma',
      email: 'siddharth@hyperlogix.tech',
      phone: '+1-972-555-0123',
      company: 'HyperLogix Supply',
      jobTitle: 'Chief Information Officer',
      industry: 'Technology',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'MEETING',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Rachel',
      lastName: 'Goldman',
      email: 'rachel@quantumedge-capital.com',
      phone: '+1-212-555-0187',
      company: 'QuantumEdge Capital',
      jobTitle: 'Partner',
      industry: 'Finance',
      companySize: '51-200',
      source: 'REFERRAL',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Dmitri',
      lastName: 'Volkov',
      email: 'dmitri@invalid-domain-tempmail.xyz',
      phone: '+1-415-555-0150',
      company: 'Volkov Logistics',
      jobTitle: 'Operations Specialist',
      industry: 'Logistics',
      companySize: '11-50',
      source: 'IMPORT',
      status: 'NOT_INTERESTED',
      emailVerificationStatus: 'INVALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Sophia',
      lastName: 'Martinez',
      email: 'sophia.m@omnichannel-retail.com',
      phone: '+1-305-555-0139',
      company: 'OmniChannel Retail',
      jobTitle: 'VP Digital Strategy',
      industry: 'E-commerce',
      companySize: '500+',
      source: 'WEBSITE',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Oliver',
      lastName: 'Bennett',
      email: 'oliver.b@apexinfra.io',
      phone: '+1-206-555-0181',
      company: 'Apex Infrastructure',
      jobTitle: 'Head of Site Reliability',
      industry: 'Cloud Computing',
      companySize: '201-500',
      source: 'LINKEDIN',
      status: 'REPLIED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Hannah',
      lastName: 'Schmidt',
      email: 'hannah.schmidt@berlin-telecom.de',
      phone: '+49-30-555-0199',
      company: 'Berlin Telecom Solutions',
      jobTitle: 'Chief Operating Officer',
      industry: 'Technology',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos@solarpower-latam.com',
      phone: '+52-55-555-0128',
      company: 'SolarPower Latam',
      jobTitle: 'Sales Representative',
      industry: 'Renewables',
      companySize: '11-50',
      source: 'MANUAL',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Nathalie',
      lastName: 'Mercier',
      email: 'nathalie.m@biocure-therapeutics.fr',
      phone: '+33-1-555-0144',
      company: 'BioCure Therapeutics',
      jobTitle: 'VP Clinical Research',
      industry: 'Healthcare',
      companySize: '201-500',
      source: 'WEBSITE',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Kenji',
      lastName: 'Takahashi',
      email: 'kenji.takahashi@tokyo-robotics.jp',
      phone: '+81-3-555-0130',
      company: 'Tokyo Robotics Labs',
      jobTitle: 'Chief Technology Officer',
      industry: 'Artificial Intelligence',
      companySize: '500+',
      source: 'REFERRAL',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Emily',
      lastName: 'Thorne',
      email: 'emily.thorne@hamptons-media.com',
      phone: '+1-631-555-0112',
      company: 'Hamptons Digital Media',
      jobTitle: 'Content Coordinator',
      industry: 'Media',
      companySize: '1-10',
      source: 'IMPORT',
      status: 'UNRESPONSIVE',
      emailVerificationStatus: 'UNKNOWN',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Arjun',
      lastName: 'Mehta',
      email: 'arjun@paysecure-gateway.in',
      phone: '+91-22-555-0177',
      company: 'PaySecure Gateway',
      jobTitle: 'Co-Founder & CTO',
      industry: 'Fintech',
      companySize: '51-200',
      source: 'LINKEDIN',
      status: 'MEETING',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Isabella',
      lastName: 'Rossi',
      email: 'isabella.rossi@milan-designhouse.it',
      phone: '+39-02-555-0199',
      company: 'Milan Design House',
      jobTitle: 'Creative Director',
      industry: 'Design',
      companySize: '11-50',
      source: 'MANUAL',
      status: 'NOT_INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Zachary',
      lastName: 'King',
      email: 'zack.king@titancloud-storage.com',
      phone: '+1-415-555-0182',
      company: 'Titan Cloud Storage',
      jobTitle: 'VP Enterprise Sales',
      industry: 'Cloud Computing',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Leila',
      lastName: 'Al-Mansoor',
      email: 'leila@dubai-finventures.ae',
      phone: '+971-4-555-0120',
      company: 'Dubai FinVentures',
      jobTitle: 'Managing Director',
      industry: 'Finance',
      companySize: '201-500',
      source: 'REFERRAL',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Liam',
      lastName: 'Gallagher',
      email: 'liam.g@celtic-cyber.ie',
      phone: '+353-1-555-0166',
      company: 'Celtic Cyber Defense',
      jobTitle: 'Security Architect',
      industry: 'Cybersecurity',
      companySize: '51-200',
      source: 'WEBSITE',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Fiona',
      lastName: 'MacLeod',
      email: 'fiona@highland-saas.co.uk',
      phone: '+44-131-555-0144',
      company: 'Highland SaaS Analytics',
      jobTitle: 'Head of Customer Success',
      industry: 'SaaS',
      companySize: '51-200',
      source: 'IMPORT',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Alejandro',
      lastName: 'Gomez',
      email: 'alejandro@madrid-biotech.es',
      phone: '+34-91-555-0111',
      company: 'Madrid BioTech Research',
      jobTitle: 'Chief Medical Officer',
      industry: 'Healthcare',
      companySize: '201-500',
      source: 'LINKEDIN',
      status: 'MEETING',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Zoe',
      lastName: 'Kravitz',
      email: 'zoe@trashmail.com',
      phone: '+1-555-019-9922',
      company: 'Fake Temp Studio',
      jobTitle: 'Intern',
      industry: 'Media',
      companySize: '1-10',
      source: 'IMPORT',
      status: 'NOT_INTERESTED',
      emailVerificationStatus: 'INVALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Gabriel',
      lastName: 'Santos',
      email: 'gabriel.santos@saopaulo-fin.br',
      phone: '+55-11-555-0188',
      company: 'Sao Paulo FinTech Hub',
      jobTitle: 'Chief Executive Officer',
      industry: 'Fintech',
      companySize: '500+',
      source: 'WEBSITE',
      status: 'INTERESTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace.hopper@compiler-tech.org',
      phone: '+1-703-555-0101',
      company: 'Compiler Tech Systems',
      jobTitle: 'Chief Scientist & Architect',
      industry: 'Technology',
      companySize: '500+',
      source: 'REFERRAL',
      status: 'CONVERTED',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Kareem',
      lastName: 'Abdul',
      email: 'kareem.abdul@cairo-commerce.eg',
      phone: '+20-2-555-0177',
      company: 'Cairo Commerce Network',
      jobTitle: 'Head of Procurement',
      industry: 'E-commerce',
      companySize: '201-500',
      source: 'LINKEDIN',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Mia',
      lastName: 'Andersson',
      email: 'mia.andersson@stockholm-ai.se',
      phone: '+46-8-555-0123',
      company: 'Stockholm Neural Labs',
      jobTitle: 'VP Product Engineering',
      industry: 'Artificial Intelligence',
      companySize: '51-200',
      source: 'WEBSITE',
      status: 'REPLIED',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    },
    {
      firstName: 'Wei',
      lastName: 'Zhang',
      email: 'wei.zhang@shanghai-saas.cn',
      phone: '+86-21-555-0199',
      company: 'Shanghai Enterprise SaaS',
      jobTitle: 'Director of Infrastructure',
      industry: 'SaaS',
      companySize: '500+',
      source: 'IMPORT',
      status: 'CONTACTED',
      emailVerificationStatus: 'VALID',
      createdBy: adminUser.id
    },
    {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.j@austin-growth.io',
      phone: '+1-512-555-0149',
      company: 'Austin Growth Partners',
      jobTitle: 'Founder',
      industry: 'SaaS',
      companySize: '11-50',
      source: 'LINKEDIN',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser2.id
    },
    {
      firstName: 'Kali',
      lastName: 'Thasan',
      email: 'kali@example.com',
      phone: '+1-408-555-0199',
      company: 'TCS',
      jobTitle: 'HR',
      industry: 'Information Technology',
      companySize: '500+',
      source: 'LINKEDIN',
      status: 'NEW',
      emailVerificationStatus: 'VALID',
      createdBy: salesUser1.id
    }
  ];

  const seededLeads: Lead[] = [];

  for (const raw of rawLeadsData) {
    const leadId = generateId();
    // Simulate baseline mock activities to feed scoring & health calculations accurately
    const mockActivities: Activity[] = [];

    if (raw.status === 'CONTACTED' || raw.status === 'REPLIED' || raw.status === 'INTERESTED' || raw.status === 'MEETING' || raw.status === 'CONVERTED') {
      mockActivities.push({
        id: generateId(),
        leadId,
        type: 'EMAIL_SENT',
        title: 'Initial Outreach Sent',
        createdAt: new Date().toISOString()
      });
    }

    if (raw.status === 'REPLIED' || raw.status === 'INTERESTED' || raw.status === 'MEETING' || raw.status === 'CONVERTED') {
      mockActivities.push({
        id: generateId(),
        leadId,
        type: 'EMAIL_OPENED',
        title: 'Email Opened',
        createdAt: new Date().toISOString()
      });
      mockActivities.push({
        id: generateId(),
        leadId,
        type: 'EMAIL_REPLIED',
        title: 'Response Received',
        createdAt: new Date().toISOString()
      });
    }

    if (raw.status === 'MEETING' || raw.status === 'CONVERTED') {
      mockActivities.push({
        id: generateId(),
        leadId,
        type: 'MEETING_SCHEDULED',
        title: 'Discovery Demo Meeting Booked',
        createdAt: new Date().toISOString()
      });
    }

    if (raw.status === 'UNRESPONSIVE') {
      mockActivities.push({ id: generateId(), leadId, type: 'EMAIL_SENT', title: 'Step 1 Sent', createdAt: new Date().toISOString() });
      mockActivities.push({ id: generateId(), leadId, type: 'FOLLOW_UP_SENT', title: 'Follow-up 1 Sent', createdAt: new Date().toISOString() });
      mockActivities.push({ id: generateId(), leadId, type: 'FOLLOW_UP_SENT', title: 'Follow-up 2 Sent', createdAt: new Date().toISOString() });
    }

    const calculatedScore = LeadScoringService.calculateScore(raw, mockActivities).totalScore;
    const calculatedHealth = LeadHealthService.calculateHealth(raw, mockActivities);

    await query(
      `INSERT INTO leads 
       (id, firstName, lastName, email, phone, company, jobTitle, industry, companySize, source, status, priorityScore, leadHealth, emailVerificationStatus, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leadId,
        raw.firstName,
        raw.lastName,
        raw.email,
        raw.phone,
        raw.company,
        raw.jobTitle,
        raw.industry,
        raw.companySize,
        raw.source,
        raw.status,
        calculatedScore,
        calculatedHealth,
        raw.emailVerificationStatus,
        raw.createdBy
      ]
    );

    const createdLead: Lead = {
      id: leadId,
      ...raw,
      priorityScore: calculatedScore,
      leadHealth: calculatedHealth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    seededLeads.push(createdLead);

    // Save initial activities for this lead
    for (const act of mockActivities) {
      await query(
        `INSERT INTO activities (id, leadId, type, title, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [act.id, act.leadId, act.type, act.title, `Automated sequence tracking event for ${raw.firstName} ${raw.lastName}`, formatMysqlDate()]
      );
    }
  }
  console.log(`✅ ${seededLeads.length} leads successfully created with score calculation and activity history.`);

  // 4. Create Campaigns
  console.log('📢 Seeding campaigns...');

  const campaign1 = {
    id: generateId(),
    name: 'Q3 Enterprise CTO Outreach',
    description: 'High-touch outreach targeting CTOs and VPs of Engineering at companies with 200+ employees.',
    status: 'ACTIVE' as const,
    createdBy: adminUser.id
  };

  const campaign2 = {
    id: generateId(),
    name: 'FinTech AI & Growth Summit 2026',
    description: 'Invitations and personalized demo booking sequence for FinTech and SaaS leaders.',
    status: 'ACTIVE' as const,
    createdBy: salesUser1.id
  };

  const campaign3 = {
    id: generateId(),
    name: 'Early-Stage Founders Cold Intro',
    description: 'Product introduction and special launch trial offer for startup founders.',
    status: 'PAUSED' as const,
    createdBy: salesUser2.id
  };

  const campaign4 = {
    id: generateId(),
    name: 'Q2 SaaS Pipeline Revival',
    description: 'Re-engagement campaign for past unresponsive accounts.',
    status: 'COMPLETED' as const,
    createdBy: adminUser.id
  };

  const campaign5 = {
    id: generateId(),
    name: 'TCS Campaign',
    description: 'Enterprise outreach campaign for TCS human resources and technical leaders.',
    status: 'ACTIVE' as const,
    createdBy: salesUser1.id
  };

  for (const c of [campaign1, campaign2, campaign3, campaign4, campaign5]) {
    await query(
      'INSERT INTO campaigns (id, name, description, status, createdBy) VALUES (?, ?, ?, ?, ?)',
      [c.id, c.name, c.description, c.status, c.createdBy]
    );
  }
  console.log('✅ 5 Campaigns created');

  // 5. Create Email Sequences & Multi-Step Cadences
  console.log('✉️ Seeding email sequences & cadence steps...');

  const sequences = [
    {
      campaign: campaign1,
      name: 'CTO Enterprise Cadence (4 Steps)',
      steps: [
        {
          stepNumber: 1,
          subject: 'Quick question regarding {{company}}\'s outbound infrastructure',
          body: 'Hi {{firstName}},\n\nI noticed your team at {{company}} is scaling rapidly. As {{jobTitle}}, are you currently facing challenges prioritizing which enterprise accounts deserve sales attention?\n\nOutreachFlow helps engineering-driven teams automate lead scoring with 0-100 explainable ranking and built-in campaign safety guards.\n\nWorth a 10-minute chat this Thursday?\n\nBest,\nSarah Connor',
          delayDays: 0
        },
        {
          stepNumber: 2,
          subject: 'Re: Quick question regarding {{company}}\'s outbound infrastructure',
          body: 'Hi {{firstName}},\n\nFollowing up on my previous note. Most engineering leaders tell us their sales reps waste 40% of their time on bad emails or low-intent contacts.\n\nWould you be open to seeing our benchmark report for {{industry}} companies?\n\nBest,\nSarah',
          delayDays: 3
        },
        {
          stepNumber: 3,
          subject: 'Sharing a case study relevant to {{company}}',
          body: 'Hi {{firstName}},\n\nHere is how a similar {{industry}} leader increased booked demos by 3.2x while cutting email bounce rates to 0.4% using our Campaign Guard.\n\nLet me know if you\'d like the 2-page teardown.\n\nBest,\nSarah',
          delayDays: 7
        },
        {
          stepNumber: 4,
          subject: 'Closing the loop on {{company}}',
          body: 'Hi {{firstName}},\n\nI don\'t want to be a pest if this isn\'t on your roadmap right now. If things change next quarter, feel free to reach out anytime.\n\nWishing you and {{company}} continued success!\n\nBest,\nSarah Connor',
          delayDays: 14
        }
      ]
    },
    {
      campaign: campaign2,
      name: 'FinTech Growth Cadence (3 Steps)',
      steps: [
        {
          stepNumber: 1,
          subject: 'Exclusive invitation for {{firstName}} & {{company}}',
          body: 'Hi {{firstName}},\n\nWe are hosting an executive briefing on scalable outbound architecture for high-growth {{industry}} leaders.\n\nGiven your role as {{jobTitle}} at {{company}}, we\'d love to reserve a VIP seat for you.\n\nWould you like me to send over the agenda?\n\nCheers,\nAlex Mercer',
          delayDays: 0
        },
        {
          stepNumber: 2,
          subject: 'VIP pass confirmed for {{company}}',
          body: 'Hi {{firstName}},\n\nJust checking in before slots fill up. We have speakers from top Tier-1 fintech firms sharing their lead priority scoring formulas.\n\nCan I confirm your attendance for next Tuesday?\n\nCheers,\nAlex',
          delayDays: 4
        },
        {
          stepNumber: 3,
          subject: 'Final reminder: {{company}} VIP registration',
          body: 'Hi {{firstName}},\n\nLast call for the executive briefing! If you cannot make it, let me know and I can email you the recorded keynotes after.\n\nCheers,\nAlex',
          delayDays: 8
        }
      ]
    },
    {
      campaign: campaign5,
      name: 'TCS Executive Cadence (3 Steps)',
      steps: [
        {
          stepNumber: 1,
          subject: 'Connecting with {{company}} / {{firstName}}',
          body: 'Hi {{firstName}},\n\nI came across {{company}} and noticed your work as {{jobTitle}}.\n\nWould you be open to a quick intro call?\n\nBest regards,\nOutreachFlow',
          delayDays: 0
        },
        {
          stepNumber: 2,
          subject: 'Quick follow up regarding {{company}}\'s team',
          body: 'Hi {{firstName}},\n\nFollowing up on my previous note regarding outbound and campaign automation at {{company}}.\n\nWould you be open to a 10-minute chat this week?\n\nBest,\nOutreachFlow',
          delayDays: 3
        },
        {
          stepNumber: 3,
          subject: 'Resource sharing for {{company}}',
          body: 'Hi {{firstName}},\n\nSharing our latest case study on optimizing sales team efficiency.\n\nBest regards,\nOutreachFlow',
          delayDays: 7
        }
      ]
    }
  ];

  for (const seq of sequences) {
    const seqId = generateId();
    await query(
      'INSERT INTO email_sequences (id, campaignId, name) VALUES (?, ?, ?)',
      [seqId, seq.campaign.id, seq.name]
    );

    for (const step of seq.steps) {
      await query(
        `INSERT INTO email_steps (id, sequenceId, campaignId, stepNumber, subject, body, delayDays)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateId(), seqId, seq.campaign.id, step.stepNumber, step.subject, step.body, step.delayDays]
      );
    }
  }
  console.log('✅ Email sequences & steps created.');

  // 6. Enroll Leads into Campaigns (campaign_leads junction)
  console.log('🔗 Enrolling leads into campaigns with junction records...');

  // Enroll first 12 leads into Campaign 1
  for (let i = 0; i < 12; i++) {
    const lead = seededLeads[i];
    const junctionStatus = lead.status === 'CONVERTED' ? 'CONVERTED'
      : lead.status === 'REPLIED' || lead.status === 'INTERESTED' || lead.status === 'MEETING' ? 'REPLIED'
      : lead.status === 'CONTACTED' ? 'CONTACTED' : 'PENDING';

    await query(
      `INSERT INTO campaign_leads (id, campaignId, leadId, status, enrolledAt, lastContactedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        campaign1.id,
        lead.id,
        junctionStatus,
        formatMysqlDate(new Date(Date.now() - 5 * 86400000)),
        junctionStatus !== 'PENDING' ? formatMysqlDate() : null
      ]
    );

    await query(
      `INSERT INTO activities (id, leadId, campaignId, type, title, description, createdAt)
       VALUES (?, ?, ?, 'CAMPAIGN_ADDED', 'Enrolled in Campaign', ?, ?)`,
      [generateId(), lead.id, campaign1.id, `Enrolled into campaign: ${campaign1.name}`, formatMysqlDate()]
    );
  }

  // Enroll 8 leads into Campaign 2
  for (let i = 12; i < 20; i++) {
    const lead = seededLeads[i];
    await query(
      `INSERT INTO campaign_leads (id, campaignId, leadId, status, enrolledAt, lastContactedAt)
       VALUES (?, ?, ?, 'CONTACTED', ?, ?)`,
      [
        generateId(),
        campaign2.id,
        lead.id,
        formatMysqlDate(new Date(Date.now() - 3 * 86400000)),
        formatMysqlDate()
      ]
    );

    await query(
      `INSERT INTO activities (id, leadId, campaignId, type, title, description, createdAt)
       VALUES (?, ?, ?, 'CAMPAIGN_ADDED', 'Enrolled in Campaign', ?, ?)`,
      [generateId(), lead.id, campaign2.id, `Enrolled into campaign: ${campaign2.name}`, formatMysqlDate()]
    );
  }

  // Enroll Kali Thasan (last lead) into Campaign 5 (TCS Campaign) as PENDING ready for Day 0 send
  const kaliLead = seededLeads.find(l => l.firstName === 'Kali' && l.lastName === 'Thasan') || seededLeads[seededLeads.length - 1];
  if (kaliLead) {
    await query(
      `INSERT INTO campaign_leads (id, campaignId, leadId, status, enrolledAt, lastContactedAt)
       VALUES (?, ?, ?, 'PENDING', ?, NULL)`,
      [
        generateId(),
        campaign5.id,
        kaliLead.id,
        formatMysqlDate()
      ]
    );

    await query(
      `INSERT INTO activities (id, leadId, campaignId, type, title, description, createdAt)
       VALUES (?, ?, ?, 'CAMPAIGN_ADDED', 'Enrolled in Campaign', ?, ?)`,
      [generateId(), kaliLead.id, campaign5.id, `Enrolled into campaign: ${campaign5.name}`, formatMysqlDate()]
    );
  }

  console.log('🎉 Seeding completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
