CREATE TABLE `email_verifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`family` varchar(36) NOT NULL,
	`used` tinyint NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`role` enum('CUSTOMER','CAREER_SPECIALIST','CV_WRITER','APPLICATION_SPECIALIST','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
	`email_verified` tinyint NOT NULL DEFAULT 0,
	`profile_complete` tinyint NOT NULL DEFAULT 0,
	`avatar_url` text,
	`phone` varchar(30),
	`linkedin_url` varchar(500),
	`location` varchar(255),
	`job_title` varchar(255),
	`years_experience` tinyint,
	`target_salary_min` varchar(20),
	`target_salary_max` varchar(20),
	`bio` text,
	`stripe_customer_id` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`service_type` varchar(100) NOT NULL,
	`status` enum('PENDING','PAID','PROCESSING','COMPLETE','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`amount_pence` int NOT NULL,
	`stripe_payment_intent_id` varchar(100),
	`notes` text,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`plan` enum('EXPLORE','LAUNCH','MOMENTUM','GUIDED') NOT NULL DEFAULT 'EXPLORE',
	`status` enum('ACTIVE','PAST_DUE','CANCELED','TRIALING','INCOMPLETE') NOT NULL DEFAULT 'ACTIVE',
	`stripe_subscription_id` varchar(100),
	`stripe_price_id` varchar(100),
	`current_period_start` timestamp,
	`current_period_end` timestamp,
	`cancel_at_period_end` tinyint NOT NULL DEFAULT 0,
	`trial_end` timestamp,
	`cv_credits_used` int NOT NULL DEFAULT 0,
	`apply_credits_used` int NOT NULL DEFAULT 0,
	`weekly_applications_used` int NOT NULL DEFAULT 0,
	`week_started_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cv_revisions` (
	`id` varchar(36) NOT NULL,
	`cv_id` varchar(36) NOT NULL,
	`version` varchar(10) NOT NULL,
	`r2_key` varchar(500) NOT NULL,
	`notes` text,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cv_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cvs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('DRAFT','IN_REVIEW','REQUIRES_CHANGES','APPROVED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`target_role` varchar(255),
	`target_sector` varchar(255),
	`is_primary` tinyint NOT NULL DEFAULT 0,
	`r2_key` varchar(500),
	`word_r2_key` varchar(500),
	`content` text,
	`ai_feedback` text,
	`specialist_notes` text,
	`assigned_to` varchar(36),
	`ats_score` varchar(10),
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cvs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_events` (
	`id` varchar(36) NOT NULL,
	`application_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`status` enum('SAVED','PREPARING','APPLIED','RECRUITER_SCREEN','FIRST_INTERVIEW','TECHNICAL_INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SAVED',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `application_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`cv_id` varchar(36),
	`company_name` varchar(255) NOT NULL,
	`job_title` varchar(255) NOT NULL,
	`job_url` text,
	`job_description` text,
	`location` varchar(255),
	`salary_range` varchar(100),
	`work_mode` enum('REMOTE','HYBRID','ONSITE'),
	`status` enum('SAVED','PREPARING','APPLIED','RECRUITER_SCREEN','FIRST_INTERVIEW','TECHNICAL_INTERVIEW','FINAL_INTERVIEW','OFFER','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SAVED',
	`applied_at` timestamp,
	`deadline` timestamp,
	`user_approved` tinyint NOT NULL DEFAULT 0,
	`cover_letter` text,
	`tailored_cv_r2_key` varchar(500),
	`role_fit_score` int,
	`role_fit_breakdown` text,
	`notes` text,
	`source` varchar(100),
	`assigned_to` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` varchar(36) NOT NULL,
	`application_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`round` int NOT NULL DEFAULT 1,
	`interview_type` enum('VIDEO','PHONE','ONSITE','TECHNICAL','ASSESSMENT'),
	`scheduled_at` timestamp,
	`duration` int,
	`interviewers` text,
	`notes` text,
	`outcome` enum('PASS','FAIL','PENDING','RESCHEDULED') DEFAULT 'PENDING',
	`feedback_notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_bank` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`evidence_type` enum('ACHIEVEMENT','SKILL','PROJECT','CERTIFICATION','EDUCATION','WORK_EXPERIENCE','VOLUNTEER','PUBLICATION','AWARD','OTHER') NOT NULL,
	`title` varchar(255) NOT NULL,
	`organisation` varchar(255),
	`start_date` varchar(10),
	`end_date` varchar(10),
	`current` tinyint NOT NULL DEFAULT 0,
	`description` text,
	`metrics` text,
	`skills` text,
	`star_method` text,
	`r2_key` varchar(500),
	`pinned` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gmail_connections` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`gmail_email` varchar(255) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`token_expiry` timestamp NOT NULL,
	`last_synced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gmail_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `gmail_connections_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ev_user` ON `email_verifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_user` ON `password_resets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rt_user` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rt_family` ON `refresh_tokens` (`family`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_orders_user` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sub_user` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cvr_cv` ON `cv_revisions` (`cv_id`);--> statement-breakpoint
CREATE INDEX `idx_cvs_user` ON `cvs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_cvs_status` ON `cvs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ae_app` ON `application_events` (`application_id`);--> statement-breakpoint
CREATE INDEX `idx_apps_user` ON `applications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_apps_status` ON `applications` (`status`);--> statement-breakpoint
CREATE INDEX `idx_iv_app` ON `interviews` (`application_id`);--> statement-breakpoint
CREATE INDEX `idx_iv_user` ON `interviews` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_eb_user` ON `evidence_bank` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_eb_type` ON `evidence_bank` (`evidence_type`);--> statement-breakpoint
CREATE INDEX `idx_gmail_user` ON `gmail_connections` (`user_id`);