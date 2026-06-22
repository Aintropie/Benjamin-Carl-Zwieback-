import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, real, boolean } from 'drizzle-orm/pg-core';

// Users table mapping Firebase UIDs to serial IDs for relational consistency
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Player progress/career tracking table
export const playerProgress = pgTable('player_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  cash: integer('cash').notNull().default(1000),
  health: integer('health').notNull().default(100),
  weapons: text('weapons').notNull().default('Pistol'),
  heat: integer('heat').notNull().default(0),
  posX: real('pos_x').default(1000),
  posY: real('pos_y').default(1000),
  avatarUrl: text('avatar_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Imported Google Drive assets (3D Models / Map Customizations / GLBs / Tiles)
export const importedAssets = pgTable('imported_assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  fileId: text('file_id').notNull(), // Google Drive File ID
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // e.g. 'glb', 'tiles', 'image'
  downloadUrl: text('download_url'),
  applied: boolean('applied').notNull().default(true),
  metadata: text('metadata'), // Extra JSON attributes
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations definitions for Drizzle
export const usersRelations = relations(users, ({ one, many }) => ({
  progress: one(playerProgress, {
    fields: [users.id],
    references: [playerProgress.userId],
  }),
  assets: many(importedAssets),
}));

export const importedAssetsRelations = relations(importedAssets, ({ one }) => ({
  user: one(users, {
    fields: [importedAssets.userId],
    references: [users.id],
  }),
}));
