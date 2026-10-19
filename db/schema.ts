import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const documents = sqliteTable('documents', {
 format:text('format').notNull().default('txt'),extractionJson:text('extraction_json'),originalKey:text('original_key'),originalHash:text('original_hash'),id:text('id').primaryKey(),owner:text('owner').notNull(),documentId:text('document_id').notNull(),version:text('version').notNull(),title:text('title').notNull(),department:text('department').notNull(),status:text('status').notNull(),effectiveFrom:text('effective_from').notNull(),effectiveUntil:text('effective_until'),filename:text('filename').notNull(),content:text('content').notNull(),contentHash:text('content_hash').notNull(),synthetic:text('synthetic').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('owner_version').on(t.owner,t.documentId,t.version),uniqueIndex('owner_hash').on(t.owner,t.contentHash)]);
export const conflictReviews=sqliteTable('conflict_reviews',{
 revision:text('revision').notNull().default(''),
 id:text('id').primaryKey(),owner:text('owner').notNull(),pair:text('pair').notNull(),reviewDate:text('review_date').notNull(),signature:text('signature').notNull(),status:text('status').notNull(),notes:text('notes').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[uniqueIndex('owner_pair_date').on(t.owner,t.pair,t.reviewDate)]);
