import { pgTable, text, serial, timestamp, jsonb, integer, foreignKey, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

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
  caption: text("caption"),
  status: text("status").notNull().default("pending"),
  style: text("style").notNull().default("dramatic"),
  metadata: jsonb("metadata").notNull().default({}),
  userId: integer("user_id").references(() => users.id),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const videoLikes = pgTable("video_likes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueLike: unique().on(table.videoId, table.userId),
}));

// Add CSP violations table
export const cspViolations = pgTable("csp_violations", {
  id: serial("id").primaryKey(),
  blockedUri: text("blocked_uri").notNull(),
  documentUri: text("document_uri").notNull(),
  violatedDirective: text("violated_directive").notNull(),
  originalPolicy: text("original_policy").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export type InsertVideo = typeof videos.$inferInsert;
export type SelectVideo = typeof videos.$inferSelect;

export const insertVideoLikeSchema = createInsertSchema(videoLikes);
export const selectVideoLikeSchema = createSelectSchema(videoLikes);
export type InsertVideoLike = typeof videoLikes.$inferInsert;
export type SelectVideoLike = typeof videoLikes.$inferSelect;

export const insertCspViolationSchema = createInsertSchema(cspViolations);
export const selectCspViolationSchema = createSelectSchema(cspViolations);
export type InsertCspViolation = typeof cspViolations.$inferInsert;
export type SelectCspViolation = typeof cspViolations.$inferSelect;