-- Add STARTER to plan enum and set as new default
ALTER TABLE `subscriptions` MODIFY COLUMN `plan` enum('STARTER','EXPLORE','LAUNCH','MOMENTUM') NOT NULL DEFAULT 'STARTER';

-- Migrate existing free users (no Stripe subscription) from EXPLORE to STARTER
UPDATE `subscriptions` SET `plan` = 'STARTER' WHERE `plan` = 'EXPLORE' AND `stripe_subscription_id` IS NULL;
