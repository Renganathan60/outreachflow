# OutreachFlow

## B2B Outbound Marketing & Lead Prioritization Platform

OutreachFlow is a full-stack B2B outbound marketing platform designed to help sales teams manage leads, prioritize high-intent prospects, create outreach campaigns, automate email cadences, and track engagement.

The platform combines lead management, explainable lead scoring, campaign management, email delivery, engagement tracking, and analytics into a single application.

---

## Features

### Authentication & Authorization
- User registration and login
- Secure password hashing
- JWT-based authentication
- Protected API routes
- Role-based authorization
- Multi-user data isolation

### Lead Management
- Create and manage leads
- Lead profile and details
- Email validation
- Lead ownership
- Lead scoring
- Explainable scoring factors
- Lead priority classification

### Lead Scoring

Leads are evaluated using multiple factors such as:

- Email verification status
- Job title / decision-maker status
- Company information
- Email engagement
- Replies
- Meetings

The score helps classify leads into different priority levels.

### Campaign Management
- Create campaigns
- Manage campaign status
- Add leads to campaigns
- Campaign Guard validation
- Campaign-specific analytics
- User-specific campaign access

### Campaign Guard

Campaign Guard validates leads before enrollment and prevents unsafe or invalid leads from entering outreach campaigns.

Validation can include:

- Email validity
- Verification status
- Duplicate enrollment
- Lead ownership
- Campaign eligibility
- Safety checks

### Email Cadence

Campaigns can contain multiple outreach steps.

Example:

```text
Day 0 → Initial Email
Day 2 → Follow-up
Day 5 → Final Follow-up    
