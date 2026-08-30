-- ── CVs: fix status enum & rename target_company → target_sector ─────────
ALTER TABLE cvs
  MODIFY COLUMN content TEXT NULL,
  MODIFY COLUMN status ENUM('DRAFT','IN_REVIEW','REQUIRES_CHANGES','APPROVED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  CHANGE COLUMN target_company target_sector VARCHAR(255) NULL;

-- ── CVs: add new columns ──────────────────────────────────────────────────
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS is_primary TINYINT NOT NULL DEFAULT 0;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS r2_key VARCHAR(500);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS word_r2_key VARCHAR(500);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS specialist_notes TEXT;
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(36);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS ats_score VARCHAR(10);
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;
ALTER TABLE cvs DROP COLUMN IF EXISTS file_url;

-- ── Applications: fix status enum & rename columns ────────────────────────
ALTER TABLE applications
  MODIFY COLUMN status ENUM('SAVED','PREPARING','APPLIED','RECRUITER_SCREEN','FIRST_INTERVIEW','TECHNICAL_INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SAVED',
  CHANGE COLUMN company company_name VARCHAR(255) NOT NULL,
  CHANGE COLUMN role job_title VARCHAR(255) NOT NULL;

-- ── Applications: add new columns ────────────────────────────────────────
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_id VARCHAR(36);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS work_mode ENUM('REMOTE','HYBRID','ONSITE');
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deadline TIMESTAMP NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_approved TINYINT NOT NULL DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS tailored_cv_r2_key VARCHAR(500);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS role_fit_score INT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS role_fit_breakdown TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(36);

-- ── New tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_events (
  id             VARCHAR(36) NOT NULL PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL,
  user_id        VARCHAR(36) NOT NULL,
  event_type     VARCHAR(100) NOT NULL,
  from_status    ENUM('SAVED','PREPARING','APPLIED','RECRUITER_SCREEN','FIRST_INTERVIEW','TECHNICAL_INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN'),
  to_status      ENUM('SAVED','PREPARING','APPLIED','RECRUITER_SCREEN','FIRST_INTERVIEW','TECHNICAL_INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN'),
  notes          TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ae_app (application_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id             VARCHAR(36) NOT NULL PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL,
  user_id        VARCHAR(36) NOT NULL,
  round          INT NOT NULL DEFAULT 1,
  interview_type ENUM('VIDEO','PHONE','ONSITE','TECHNICAL','ASSESSMENT'),
  scheduled_at   TIMESTAMP NULL,
  duration       INT,
  interviewers   TEXT,
  notes          TEXT,
  outcome        ENUM('PASS','FAIL','PENDING','RESCHEDULED') DEFAULT 'PENDING',
  feedback_notes TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_iv_app (application_id),
  INDEX idx_iv_user (user_id)
);

CREATE TABLE IF NOT EXISTS cv_revisions (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  cv_id      VARCHAR(36) NOT NULL,
  version    VARCHAR(10) NOT NULL,
  r2_key     VARCHAR(500) NOT NULL,
  notes      TEXT,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cvr_cv (cv_id)
);

SELECT 'Migration v2 complete' AS result;
