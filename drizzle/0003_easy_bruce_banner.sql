ALTER TABLE `conflict_reviews` ADD `revision` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE `conflict_reviews` SET `revision` = `id` WHERE `revision` = '';
