import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';

export const starmaps = pgTable('starmaps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').default('Untitled Starmap'),
  status: text('status', { 
    enum: ['draft', 'in_progress', 'review', 'completed', 'archived'] 
  }).default('draft'),
  
  // High-level context provided by user
  context: jsonb('context').$type<{
    role?: string;
    goals?: string;
    industry?: string;
    organization?: string;
  }>(),

  // The generated blueprint content
  blueprint: jsonb('blueprint'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const starmapResponses = pgTable('starmap_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  starmapId: uuid('starmap_id').references(() => starmaps.id, { onDelete: 'cascade' }).notNull(),
  
  // Question ID from the AI-generated schema (e.g., q1_s1)
  questionId: text('question_id').notNull(),
  
  // The user's answer
  answer: text('answer').notNull(),
  
  // Metadata about the interaction
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
