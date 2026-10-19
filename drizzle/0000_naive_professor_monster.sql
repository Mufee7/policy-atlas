CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`document_id` text NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`department` text NOT NULL,
	`status` text NOT NULL,
	`effective_from` text NOT NULL,
	`effective_until` text,
	`filename` text NOT NULL,
	`content` text NOT NULL,
	`content_hash` text NOT NULL,
	`synthetic` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `owner_version` ON `documents` (`owner`,`document_id`,`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `owner_hash` ON `documents` (`owner`,`content_hash`);