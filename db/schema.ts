import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stylePresets = {
  dramatic: "Dramatic and intense scenes with high contrast",
  romantic: "Soft and emotional scenes with warm colors",
  action: "Fast-paced action sequences with dynamic transitions",
  aesthetic: "Aesthetic and dreamy scenes with pastel colors",
  retro: "Retro anime style with film grain effect",
} as const;

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  musicFile: text("music_file").notNull(),
  outputUrl: text("output_url"),
  status: text("status").notNull().default("pending"),
  style: text("style").notNull().default("dramatic"),
  metadata: jsonb("metadata").notNull().default({}),
  userId: serial("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type StylePreset = keyof typeof stylePresets;

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export type InsertVideo = typeof videos.$inferInsert;
export type SelectVideo = typeof videos.$inferSelect;

// Drop and recreate the table to ensure schema consistency
export const migrateVideos = `
DROP TABLE IF EXISTS videos CASCADE;
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  music_file TEXT NOT NULL,
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  style TEXT NOT NULL DEFAULT 'dramatic',
  metadata JSONB NOT NULL DEFAULT '{}',
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

export const migrateUsers = `
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`