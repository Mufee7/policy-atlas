CREATE TABLE `conflict_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`pair` text NOT NULL,
	`review_date` text NOT NULL,
	`signature` text NOT NULL,
	`status` text NOT NULL,
	`notes` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owner_pair_date` ON `conflict_reviews` (`owner`,`pair`,`review_date`);