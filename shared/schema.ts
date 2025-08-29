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
