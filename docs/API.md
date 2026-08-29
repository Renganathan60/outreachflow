# OutreachFlow REST API Specification

**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <jwt_token>`)

---

## 1. Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Auth**: Public
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah.sales@outreachflow.com",
  "password": "Password123!",
  "role": "SALES_USER"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "name": "Sarah Connor",
      "email": "sarah.sales@outreachflow.com",
      "role": "SALES_USER",
      "createdAt": "2026-08-28 12:00:00"
    },
    "token": "eyJhbGciOi..."
  },
  "message": "User registered successfully"
}
```

### Login
- **POST** `/auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "admin@outreachflow.com",
  "password": "Password123!"
}
```
- **Response**: `200 OK`

---

## 2. Lead Management & Prioritization

### List Leads (Filtered & Paginated)
- **GET** `/leads?page=1&limit=15&search=cloud&status=NEW&priorityTier=HIGH`
- **Auth**: Required (`ADMIN` or `SALES_USER`)
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 15, max: 100)
  - `search` (string)
  - `status` (`NEW`, `CONTACTED`, `REPLIED`, `INTERESTED`, `MEETING`, `CONVERTED`, `NOT_INTERESTED`, `UNRESPONSIVE`)
  - `industry` (string)
  - `source` (`LINKEDIN`, `WEBSITE`, `REFERRAL`, `IMPORT`, `MANUAL`)
  - `companySize` (`1-10`, `11-50`, `51-200`, `201-500`, `500+`)
  - `emailVerificationStatus` (`VALID`, `INVALID`, `UNKNOWN`)
  - `leadHealth` (`ACTIVE`, `NEEDS_FOLLOW_UP`, `HIGH_INTENT`, `UNRESPONSIVE`, `DO_NOT_CONTACT`)
  - `priorityTier` (`HIGH`, `MEDIUM`, `LOW`)
  - `sortBy` (`createdAt`, `priorityScore`, `company`, `status`, `firstName`)
  - `sortOrder` (`ASC`, `DESC`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "lead-uuid",
      "firstName": "Satya",
      "lastName": "Nadella",
      "email": "satya@techcorp-cloud.com",
      "company": "TechCorp Cloud",
      "jobTitle": "Chief Executive Officer",
      "industry": "Technology",
      "companySize": "500+",
      "source": "LINKEDIN",
      "status": "MEETING",
      "priorityScore": 100,
      "leadHealth": "HIGH_INTENT",
      "emailVerificationStatus": "VALID"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 15,
    "total": 35,
    "totalPages": 3
  }
}
```

### Lead Score Explanation (Unique Feature #1)
- **GET** `/leads/:id/priority`
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalScore": 100,
    "tier": "HIGH",
    "summary": "HIGH Priority (100/100) based on 6 qualifying criteria.",
    "factors": [
      { "factor": "VALID_EMAIL", "points": 20, "description": "Verified deliverable email address", "applied": true },
      { "factor": "DECISION_MAKER_TITLE", "points": 25, "description": "High-value decision maker role (Chief Executive Officer)", "applied": true },
      { "factor": "LARGE_ENTERPRISE", "points": 20, "description": "Enterprise company tier (500+ employees)", "applied": true },
      { "factor": "TARGET_INDUSTRY", "points": 10, "description": "Target high-growth industry (Technology)", "applied": true },
      { "factor": "EMAIL_REPLIED", "points": 25, "description": "Lead actively engaged and replied to outreach", "applied": true },
      { "factor": "MEETING_BOOKED", "points": 25, "description": "Demo or discovery meeting booked", "applied": true }
    ]
  }
}
```

### Log Lead Activity & Trigger Dynamic Re-Scoring
- **POST** `/leads/:id/activities`
- **Auth**: Required
- **Request Body**:
```json
{
  "type": "EMAIL_REPLIED",
  "title": "Prospect Replied to Outbound Pitch",
  "description": "Lead requested pricing deck",
  "autoUpdateLeadStatus": "REPLIED"
}
```
- **Response**: `201 Created`

---

## 3. Campaign Management & Campaign Guard

### List Campaigns
- **GET** `/campaigns`
- **Response**: `200 OK`

### Campaign Guard Dry-Run Preview (Unique Feature #3)
- **POST** `/campaigns/:id/leads/preview-guard`
- **Request Body**:
```json
{
  "leadIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "eligibleLeads": [...],
    "blockedLeads": [
      {
        "lead": { "id": "uuid-2", "firstName": "Dmitri", "email": "dmitri@tempmail.xyz" },
        "reasons": ["Lead has an INVALID or undeliverable email address."]
      }
    ],
    "totalEvaluated": 3,
    "passRate": 67
  }
}
```

### Enroll Leads with Campaign Guard
- **POST** `/campaigns/:id/leads`
- **Request Body**: `{ "leadIds": ["uuid-1", "uuid-3"] }`
- **Response**: `200 OK`

---

## 4. Email Sequences & Cadences

### Get Cadence Steps
- **GET** `/campaigns/:campaignId/sequences`

### Add Cadence Step
- **POST** `/campaigns/:campaignId/sequences/steps`
- **Request Body**:
```json
{
  "subject": "Quick question regarding {{company}}",
  "body": "Hi {{firstName}},\n\nNoticed {{company}} is scaling...",
  "delayDays": 3
}
```

---

## 5. Analytics Overview
- **GET** `/analytics/overview`
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalLeads": 35,
    "activeCampaigns": 2,
    "emailsSent": 20,
    "emailsOpened": 14,
    "replies": 9,
    "interestedLeads": 7,
    "meetingsScheduled": 5,
    "conversions": 2,
    "conversionRate": 6,
    "priorityDistribution": { "high": 12, "medium": 15, "low": 8 },
    "healthDistribution": { "active": 18, "needsFollowUp": 8, "highIntent": 7, "unresponsive": 1, "doNotContact": 1 }
  }
}
```
