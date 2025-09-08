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
  commonNames: text("common_names").array().default([]),
  family: text("family"),
  genus: text("genus"),
  species: text("species"),
  description: text("description"),
  uses: text("uses").notNull(),
  preparation: text("preparation"),
  careInstructions: text("care_instructions"),
  growingConditions: text("growing_conditions"),
  bloomTime: text("bloom_time"),
  harvestTime: text("harvest_time"),
  toxicity: text("toxicity"),
  location: text("location"),
  imageUrl: text("image_url"),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  contributorId: varchar("contributor_id").references(() => users.id),
  aiConfidence: integer("ai_confidence").default(0), // AI identification confidence
  rarity: text("rarity").default("common"), // common, uncommon, rare, endangered
  // Multilingual fields
  hindiName: text("hindi_name"),
  sanskritName: text("sanskrit_name"),
  englishName: text("english_name"),
  regionalNames: text("regional_names"),
  // Additional medicinal properties
  partsUsed: text("parts_used"),
  properties: text("properties"),
  precautions: text("precautions"),
  chemicalCompounds: text("chemical_compounds"),
  therapeuticActions: text("therapeutic_actions"),
  dosage: text("dosage"),
  season: text("season"),
  habitat: text("habitat"),
  // Hindi translations for all content
  hindiDescription: text("hindi_description"),
  hindiUses: text("hindi_uses"),
  hindiPreparation: text("hindi_preparation"),
  hindiPartsUsed: text("hindi_parts_used"),
  hindiProperties: text("hindi_properties"),
  hindiPrecautions: text("hindi_precautions"),
  hindiDosage: text("hindi_dosage"),
  hindiTherapeuticActions: text("hindi_therapeutic_actions"),
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
  imageUrl: text("image_url"),
  plantId: varchar("plant_id").references(() => plants.id),
  confidence: integer("confidence").notNull(), // percentage
  userId: varchar("user_id").references(() => users.id),
  isUnknown: boolean("is_unknown").default(false),
  aiModel: text("ai_model").default("openai-vision"), // AI model used
  imageAnalysis: text("image_analysis"), // detailed analysis JSON
  healthStatus: text("health_status"), // healthy, diseased, pest_damage, nutrient_deficiency
  suggestions: text("suggestions").array().default([]), // care suggestions
  location: text("location"), // GPS coordinates or location name
  weather: text("weather"), // weather conditions when photo taken
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

export const plantHealth = pgTable("plant_health", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identificationId: varchar("identification_id").references(() => identifications.id),
  healthScore: integer("health_score").notNull(), // 0-100
  diseases: text("diseases").array().default([]),
  pests: text("pests").array().default([]),
  deficiencies: text("deficiencies").array().default([]),
  treatment: text("treatment"),
  severity: text("severity").default("mild"), // mild, moderate, severe
  createdAt: timestamp("created_at").defaultNow(),
});

export const plantCare = pgTable("plant_care", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").references(() => plants.id),
  userId: varchar("user_id").references(() => users.id),
  careType: text("care_type").notNull(), // watering, fertilizing, pruning, repotting
  scheduleType: text("schedule_type").default("weekly"), // daily, weekly, monthly, seasonal
  lastCared: timestamp("last_cared"),
  nextCare: timestamp("next_care"),
  notes: text("notes"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plantGrowth = pgTable("plant_growth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").references(() => plants.id),
  userId: varchar("user_id").references(() => users.id),
  height: integer("height"), // in cm
  width: integer("width"), // in cm
  leafCount: integer("leaf_count"),
  flowerCount: integer("flower_count"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  season: text("season"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // whatsapp, sms, call, email, care_reminder
  recipient: text("recipient").notNull(), // phone number or contact info
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, sent, delivered, failed
  plantId: varchar("plant_id").references(() => plants.id),
  careId: varchar("care_id").references(() => plantCare.id),
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

export const insertPlantHealthSchema = createInsertSchema(plantHealth).omit({
  id: true,
  createdAt: true,
});

export const insertPlantCareSchema = createInsertSchema(plantCare).omit({
  id: true,
  createdAt: true,
});

export const insertPlantGrowthSchema = createInsertSchema(plantGrowth).omit({
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

export type InsertPlantHealth = z.infer<typeof insertPlantHealthSchema>;
export type PlantHealth = typeof plantHealth.$inferSelect;

export type InsertPlantCare = z.infer<typeof insertPlantCareSchema>;
export type PlantCare = typeof plantCare.$inferSelect;

export type InsertPlantGrowth = z.infer<typeof insertPlantGrowthSchema>;
export type PlantGrowth = typeof plantGrowth.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
