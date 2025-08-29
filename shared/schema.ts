import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false),
  badges: text("badges").array().default([]),
  contributionCount: integer("contribution_count").default(0),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plants = pgTable("plants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  description: text("description"),
  uses: text("uses").notNull(),
  preparation: text("preparation"),
  location: text("location"),
  imageUrl: text("image_url"),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  contributorId: varchar("contributor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").references(() => plants.id),
  contributorId: varchar("contributor_id").references(() => users.id),
  contributorName: text("contributor_name").notNull(),
  type: text("type").notNull(), // knowledge, image, audio
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const plantImages = pgTable("plant_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").references(() => plants.id),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const identifications = pgTable("identifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  plantId: varchar("plant_id").references(() => plants.id),
  confidence: integer("confidence").notNull(), // percentage
  userId: varchar("user_id").references(() => users.id),
  isUnknown: boolean("is_unknown").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discussions = pgTable("discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identificationId: varchar("identification_id").references(() => identifications.id),
  userId: varchar("user_id").references(() => users.id),
  userRole: text("user_role").default("user"), // user, expert, admin
  content: text("content").notNull(),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contributionId: varchar("contribution_id").references(() => contributions.id),
  audioUrl: text("audio_url").notNull(),
  transcription: text("transcription"),
  language: text("language").default("en"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // whatsapp, sms, call, email
  recipient: text("recipient").notNull(), // phone number or contact info
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, sent, delivered, failed
  plantId: varchar("plant_id").references(() => plants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  createdAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

export const insertPlantImageSchema = createInsertSchema(plantImages).omit({
  id: true,
  createdAt: true,
});

export const insertIdentificationSchema = createInsertSchema(identifications).omit({
  id: true,
  createdAt: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceRecordingSchema = createInsertSchema(voiceRecordings).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

export type InsertPlantImage = z.infer<typeof insertPlantImageSchema>;
export type PlantImage = typeof plantImages.$inferSelect;

export type InsertIdentification = z.infer<typeof insertIdentificationSchema>;
export type Identification = typeof identifications.$inferSelect;

export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Discussion = typeof discussions.$inferSelect;

export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
