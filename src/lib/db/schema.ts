import { pgTable, text, timestamp, uuid, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').default('{}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').primaryKey(),
  emailUpdates: boolean('email_updates').default(true).notNull(),
  marketingEmails: boolean('marketing_emails').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const starmaps = pgTable('starmaps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').default('Untitled Starmap'),
  slug: text('slug').unique(),
  modelId: text('model_id'),
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

  // Discovery stage (1-7)
  stage: integer('stage').notNull(),

  // AI message ID for linking responses
  modelMessageId: text('model_message_id'),

  // Metadata about the interaction
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const starmapsRelations = relations(starmaps, ({ many }) => ({
  starmapResponses: many(starmapResponses),
}));

export const starmapResponsesRelations = relations(starmapResponses, ({ one }) => ({
  starmap: one(starmaps, {
    fields: [starmapResponses.starmapId],
    references: [starmaps.id],
  }),
}));
