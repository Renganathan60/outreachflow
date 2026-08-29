-- OutreachFlow MySQL 8.0 Relational Database Schema
-- B2B Outbound Marketing & Cold-Email Campaign Management SaaS

CREATE DATABASE IF NOT EXISTS outreachflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE outreachflow;

-- ===================================================
-- 1. USERS & AUTHENTICATION TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'SALES_USER') NOT NULL DEFAULT 'SALES_USER',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 2. LEADS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(36) PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    company VARCHAR(150) NOT NULL,
    jobTitle VARCHAR(150) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    companySize ENUM('1-10', '11-50', '51-200', '201-500', '500+') NOT NULL DEFAULT '11-50',
    source ENUM('LINKEDIN', 'WEBSITE', 'REFERRAL', 'IMPORT', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    status ENUM('NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'MEETING', 'CONVERTED', 'NOT_INTERESTED', 'UNRESPONSIVE') NOT NULL DEFAULT 'NEW',
    priorityScore INT NOT NULL DEFAULT 0,
    leadHealth ENUM('ACTIVE', 'NEEDS_FOLLOW_UP', 'HIGH_INTENT', 'UNRESPONSIVE', 'DO_NOT_CONTACT') NOT NULL DEFAULT 'ACTIVE',
    emailVerificationStatus ENUM('VALID', 'INVALID', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    createdBy VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_leads_email (email),
    INDEX idx_leads_status (status),
    INDEX idx_leads_priorityScore (priorityScore),
    INDEX idx_leads_leadHealth (leadHealth),
    INDEX idx_leads_company (company),
    INDEX idx_leads_industry (industry),
    INDEX idx_leads_createdBy (createdBy),
    INDEX idx_leads_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 3. CAMPAIGNS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    createdBy VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_campaigns_status (status),
    INDEX idx_campaigns_createdBy (createdBy),
    INDEX idx_campaigns_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 4. CAMPAIGN_LEADS JUNCTION TABLE (Many-to-Many)
-- ===================================================
CREATE TABLE IF NOT EXISTS campaign_leads (
    id VARCHAR(36) PRIMARY KEY,
    campaignId VARCHAR(36) NOT NULL,
    leadId VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'CONTACTED', 'REPLIED', 'CONVERTED', 'OPTED_OUT') NOT NULL DEFAULT 'PENDING',
    enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastContactedAt TIMESTAMP NULL,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE,
    UNIQUE KEY uq_campaign_lead (campaignId, leadId),
    INDEX idx_campaign_leads_campaign (campaignId),
    INDEX idx_campaign_leads_lead (leadId),
    INDEX idx_campaign_leads_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 5. EMAIL SEQUENCES TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS email_sequences (
    id VARCHAR(36) PRIMARY KEY,
    campaignId VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_sequences_campaign (campaignId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 6. EMAIL STEPS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS email_steps (
    id VARCHAR(36) PRIMARY KEY,
    sequenceId VARCHAR(36) NOT NULL,
    campaignId VARCHAR(36) NOT NULL,
    stepNumber INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    delayDays INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sequenceId) REFERENCES email_sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
    INDEX idx_steps_sequence (sequenceId),
    INDEX idx_steps_stepNumber (stepNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- 7. ACTIVITIES TABLE (Lead Engagement & History)
-- ===================================================
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY,
    leadId VARCHAR(36) NOT NULL,
    campaignId VARCHAR(36) NULL,
    userId VARCHAR(36) NULL,
    type ENUM(
        'EMAIL_SENT',
        'EMAIL_OPENED',
        'EMAIL_REPLIED',
        'FOLLOW_UP_SENT',
        'STATUS_CHANGED',
        'CAMPAIGN_ADDED',
        'CAMPAIGN_REMOVED',
        'MEETING_SCHEDULED'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    metadata JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activities_lead (leadId),
    INDEX idx_activities_campaign (campaignId),
    INDEX idx_activities_type (type),
    INDEX idx_activities_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
