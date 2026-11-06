-- Elite Concierge: new plan tier, managed-service tables, submission log.
-- Idempotent where MySQL allows it. Applied manually (the drizzle journal is not kept in step with prod).

-- 1. Add ELITE to the plan enum (existing values and rows are untouched)
ALTER TABLE `subscriptions` MODIFY COLUMN `plan` enum('STARTER','EXPLORE','LAUNCH','MOMENTUM','ELITE') NOT NULL DEFAULT 'STARTER';

-- 2. Onboarding + consent
CREATE TABLE IF NOT EXISTS `concierge_profiles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `cv_id` varchar(36) NULL,
  `preferred_roles` text NULL,
  `locations` text NULL,
  `salary_min` int NULL,
  `salary_max` int NULL,
  `work_authorisation` varchar(255) NULL,
  `work_modes` varchar(100) NULL,
  `linkedin_url` varchar(500) NULL,
  `industries` text NULL,
  `application_notes` text NULL,
  `consent_apply` tinyint NOT NULL DEFAULT 0,
  `consent_outreach` tinyint NOT NULL DEFAULT 0,
  `consented_at` timestamp NULL,
  `assigned_specialist_id` varchar(36) NULL,
  `onboarding_complete` tinyint NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_concierge_user` (`user_id`)
);

-- 3. Submission log: attempted / submitted / failed / duplicate / blocked are tracked separately
CREATE TABLE IF NOT EXISTS `application_submissions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `application_id` varchar(36) NULL,
  `outcome` enum('ATTEMPTED','SUBMITTED','FAILED','DUPLICATE','BLOCKED') NOT NULL,
  `verified` tinyint NOT NULL DEFAULT 0,
  `evidence` varchar(500) NULL,
  `failure_reason` varchar(500) NULL,
  `submitted_by` varchar(36) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_user_created` (`user_id`, `created_at`),
  KEY `idx_sub_app` (`application_id`)
);

-- 4. Recruiter communication
CREATE TABLE IF NOT EXISTS `recruiter_messages` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `application_id` varchar(36) NULL,
  `direction` enum('OUTBOUND','INBOUND') NOT NULL DEFAULT 'OUTBOUND',
  `channel` enum('EMAIL','LINKEDIN','PHONE','OTHER') NOT NULL DEFAULT 'EMAIL',
  `recruiter_name` varchar(255) NULL,
  `company` varchar(255) NULL,
  `subject` varchar(255) NULL,
  `body` text NOT NULL,
  `status` enum('DRAFT','APPROVED','SENT','REPLIED','ESCALATED') NOT NULL DEFAULT 'DRAFT',
  `approved_by` varchar(36) NULL,
  `approved_at` timestamp NULL,
  `sent_at` timestamp NULL,
  `follow_up_due_at` timestamp NULL,
  `created_by` varchar(36) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rm_user` (`user_id`)
);

-- 5. Customer actions
CREATE TABLE IF NOT EXISTS `concierge_actions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `application_id` varchar(36) NULL,
  `description` varchar(500) NOT NULL,
  `status` enum('OPEN','DONE') NOT NULL DEFAULT 'OPEN',
  `created_by` varchar(36) NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ca_user` (`user_id`)
);

-- 6. Backfill: applications already past SAVED/RECRUITER_OUTREACH were counted towards the weekly
--    allowance under the old rules. Record them as verified submissions so existing counts carry over.
INSERT INTO `application_submissions` (`id`, `user_id`, `application_id`, `outcome`, `verified`, `evidence`, `created_at`)
SELECT UUID(), a.`user_id`, a.`id`, 'SUBMITTED', 1, 'legacy-backfill', a.`created_at`
FROM `applications` a
WHERE a.`status` NOT IN ('SAVED','RECRUITER_OUTREACH')
  AND NOT EXISTS (SELECT 1 FROM `application_submissions` s WHERE s.`application_id` = a.`id`);
