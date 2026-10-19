ALTER TABLE `documents` ADD `format` text DEFAULT 'txt' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `extraction_json` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `original_key` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `original_hash` text;