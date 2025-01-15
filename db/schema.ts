import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export type InsertVideo = typeof videos.$inferInsert;
export type SelectVideo = typeof videos.$inferSelect;
export type StylePreset = keyof typeof stylePresets;