import { createId } from '@paralleldrive/cuid2';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const goals = pgTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  desiredWeeklyFrequency: integer('desired_weekly_frequency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const goalCompletions = pgTable('goal_completions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  goalId: text('goal_id').references(() => goals.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(), // Adiciona o campo userId
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
