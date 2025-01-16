import { pgTable, text, serial, timestamp, jsonb, integer, foreignKey, unique, boolean } from "drizzle-orm/pg-core";
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
  // Ensure a user can only like a video once
  uniqueLike: unique().on(table.videoId, table.userId),
}));

// New tables for background themes and votes
export const backgroundThemes = pgTable("background_themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  totalVotes: integer("total_votes").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const themeVotes = pgTable("theme_votes", {
  id: serial("id").primaryKey(),
  themeId: integer("theme_id").notNull().references(() => backgroundThemes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure a user can only vote once per theme
  uniqueVote: unique().on(table.themeId, table.userId),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type StylePreset = keyof typeof stylePresets;

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export type InsertVideo = typeof videos.$inferInsert;
export type SelectVideo = typeof videos.$inferSelect;

export const insertVideoLikeSchema = createInsertSchema(videoLikes);
export const selectVideoLikeSchema = createSelectSchema(videoLikes);
export type InsertVideoLike = typeof videoLikes.$inferInsert;
export type SelectVideoLike = typeof videoLikes.$inferSelect;

// New schemas for background themes
export const insertBackgroundThemeSchema = createInsertSchema(backgroundThemes);
export const selectBackgroundThemeSchema = createSelectSchema(backgroundThemes);
export type InsertBackgroundTheme = typeof backgroundThemes.$inferInsert;
export type SelectBackgroundTheme = typeof backgroundThemes.$inferSelect;

export const insertThemeVoteSchema = createInsertSchema(themeVotes);
export const selectThemeVoteSchema = createSelectSchema(themeVotes);
export type InsertThemeVote = typeof themeVotes.$inferInsert;
export type SelectThemeVote = typeof themeVotes.$inferSelect;