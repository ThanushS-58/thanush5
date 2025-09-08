import { 
  type User, 
  type InsertUser, 
  type Plant, 
  type InsertPlant, 
  type Contribution, 
  type InsertContribution,
  type PlantImage,
  type InsertPlantImage,
  type Identification,
  type InsertIdentification,
  type Discussion,
  type InsertDiscussion,
  type VoiceRecording,
  type InsertVoiceRecording,
  type Notification,
  type InsertNotification,
  users, plants, contributions, plantImages, identifications, discussions, voiceRecordings, notifications
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, like, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Plant operations
  getPlant(id: string): Promise<Plant | undefined>;
  getAllPlants(): Promise<Plant[]>;
  getPlantsByStatus(status: string): Promise<Plant[]>;
  searchPlants(query: string): Promise<Plant[]>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlantStatus(id: string, status: string): Promise<Plant | undefined>;

  // Contribution operations
  getContribution(id: string): Promise<Contribution | undefined>;
  getContributionsByStatus(status: string): Promise<Contribution[]>;
  getRecentContributions(limit?: number): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContributionStatus(id: string, status: string): Promise<Contribution | undefined>;

  // Plant image operations
  getPlantImages(plantId: string): Promise<PlantImage[]>;
  createPlantImage(image: InsertPlantImage): Promise<PlantImage>;

  // Identification operations
  createIdentification(identification: InsertIdentification): Promise<Identification>;
  getRecentIdentifications(limit?: number): Promise<Identification[]>;
  getUnknownIdentifications(): Promise<Identification[]>;
  
  // Discussion operations
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussionsByIdentification(identificationId: string): Promise<Discussion[]>;
  updateDiscussionResolution(id: string, isResolved: boolean): Promise<Discussion | undefined>;
  
  // Voice recording operations
  createVoiceRecording(recording: InsertVoiceRecording): Promise<VoiceRecording>;
  getVoiceRecordingsByContribution(contributionId: string): Promise<VoiceRecording[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  updateNotificationStatus(id: string, status: string): Promise<Notification | undefined>;
  
  // User badge operations
  addUserBadge(userId: string, badge: string): Promise<User | undefined>;
  updateUserContributionCount(userId: string): Promise<User | undefined>;
  
  // Advanced search
  searchPlantsBySymptom(symptom: string): Promise<Plant[]>;
  searchPlantsByRegion(region: string): Promise<Plant[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || undefined;
  }

  async getAllPlants(): Promise<Plant[]> {
    return await db.select().from(plants).where(eq(plants.verificationStatus, 'verified'));
  }

  async getPlantsByStatus(status: string): Promise<Plant[]> {
    return await db.select().from(plants).where(eq(plants.verificationStatus, status));
  }

  async searchPlants(query: string): Promise<Plant[]> {
    const likeQuery = `%${query}%`;
    return await db.select().from(plants).where(
      sql`${plants.name} ILIKE ${likeQuery} OR ${plants.scientificName} ILIKE ${likeQuery} OR ${plants.description} ILIKE ${likeQuery}`
    );
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const plantData = {
      ...insertPlant,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const [plant] = await db.insert(plants).values(plantData).returning();
    return plant;
  }

  async updatePlantStatus(id: string, status: string): Promise<Plant | undefined> {
    const [plant] = await db.update(plants)
      .set({ verificationStatus: status })
      .where(eq(plants.id, id))
      .returning();
    return plant || undefined;
  }

  async getContribution(id: string): Promise<Contribution | undefined> {
    const [contribution] = await db.select().from(contributions).where(eq(contributions.id, id));
    return contribution || undefined;
  }

  async getContributionsByStatus(status: string): Promise<Contribution[]> {
    return await db.select().from(contributions)
      .where(eq(contributions.status, status))
      .orderBy(desc(contributions.createdAt));
  }

  async getRecentContributions(limit: number = 10): Promise<Contribution[]> {
    return await db.select().from(contributions)
      .orderBy(desc(contributions.createdAt))
      .limit(limit);
  }

  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const contributionData = {
      ...insertContribution,
      id: randomUUID()
    };
    const [contribution] = await db.insert(contributions).values(contributionData).returning();
    return contribution;
  }

  async updateContributionStatus(id: string, status: string): Promise<Contribution | undefined> {
    const [contribution] = await db.update(contributions)
      .set({ status })
      .where(eq(contributions.id, id))
      .returning();
    return contribution || undefined;
  }

  async getPlantImages(plantId: string): Promise<PlantImage[]> {
    return await db.select().from(plantImages).where(eq(plantImages.plantId, plantId));
  }

  async createPlantImage(insertImage: InsertPlantImage): Promise<PlantImage> {
    const imageData = {
      ...insertImage,
      id: randomUUID()
    };
    const [image] = await db.insert(plantImages).values(imageData).returning();
    return image;
  }

  async createIdentification(insertIdentification: InsertIdentification): Promise<Identification> {
    const identificationData = {
      ...insertIdentification,
      id: randomUUID()
    };
    const [identification] = await db.insert(identifications).values(identificationData).returning();
    return identification;
  }

  async getRecentIdentifications(limit: number = 10): Promise<Identification[]> {
    return await db.select().from(identifications)
      .orderBy(desc(identifications.createdAt))
      .limit(limit);
  }

  async getUnknownIdentifications(): Promise<Identification[]> {
    return await db.select().from(identifications)
      .where(eq(identifications.isUnknown, true))
      .orderBy(desc(identifications.createdAt));
  }

  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const discussionData = {
      ...insertDiscussion,
      id: randomUUID(),
      createdAt: new Date()
    };
    const [discussion] = await db.insert(discussions).values(discussionData).returning();
    return discussion;
  }

  async getDiscussionsByIdentification(identificationId: string): Promise<Discussion[]> {
    return await db.select().from(discussions)
      .where(eq(discussions.identificationId, identificationId))
      .orderBy(desc(discussions.createdAt));
  }

  async updateDiscussionResolution(id: string, isResolved: boolean): Promise<Discussion | undefined> {
    const [discussion] = await db.update(discussions)
      .set({ isResolved })
      .where(eq(discussions.id, id))
      .returning();
    return discussion || undefined;
  }

  async createVoiceRecording(insertRecording: InsertVoiceRecording): Promise<VoiceRecording> {
    const recordingData = {
      ...insertRecording,
      id: randomUUID()
    };
    const [recording] = await db.insert(voiceRecordings).values(recordingData).returning();
    return recording;
  }

  async getVoiceRecordingsByContribution(contributionId: string): Promise<VoiceRecording[]> {
    return await db.select().from(voiceRecordings)
      .where(eq(voiceRecordings.contributionId, contributionId))
      .orderBy(desc(voiceRecordings.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notificationData = {
      ...insertNotification,
      id: randomUUID()
    };
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async updateNotificationStatus(id: string, status: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ status })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async addUserBadge(userId: string, badge: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const newBadges = [...(user.badges || []), badge];
    const [updatedUser] = await db.update(users)
      .set({ badges: newBadges })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserContributionCount(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ contributionCount: sql`${users.contributionCount} + 1` })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async searchPlantsBySymptom(symptom: string): Promise<Plant[]> {
    return await db.select().from(plants)
      .where(sql`${plants.uses} ILIKE ${`%${symptom}%`} OR ${plants.description} ILIKE ${`%${symptom}%`}`);
  }

  async searchPlantsByRegion(region: string): Promise<Plant[]> {
    return await db.select().from(plants)
      .where(sql`${plants.location} ILIKE ${`%${region}%`}`);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private plants: Map<string, Plant>;
  private contributions: Map<string, Contribution>;
  private plantImages: Map<string, PlantImage>;
  private identifications: Map<string, Identification>;
  private discussions: Map<string, Discussion>;
  private voiceRecordings: Map<string, VoiceRecording>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.contributions = new Map();
    this.plantImages = new Map();
    this.identifications = new Map();
    this.discussions = new Map();
    this.voiceRecordings = new Map();
    this.notifications = new Map();

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const user1: User = {
      id: "user-1",
      username: "maya_patel",
      email: "maya@example.com",
      name: "Dr. Maya Patel",
      isAdmin: false,
      badges: ["Expert Contributor", "First Plant"],
      contributionCount: 5,
      language: "en",
      createdAt: new Date(),
    };
    
    const user2: User = {
      id: "user-2", 
      username: "ravi_kumar",
      email: "ravi@example.com",
      name: "Ravi Kumar",
      isAdmin: false,
      badges: ["Community Helper"],
      contributionCount: 3,
      language: "en",
      createdAt: new Date(),
    };
    
    const adminUser: User = {
      id: "user-admin",
      username: "admin",
      email: "admin@mediplant.ai",
      name: "System Admin",
      isAdmin: true,
      badges: ["Administrator"],
      contributionCount: 0,
      language: "en",
      createdAt: new Date(),
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.users.set(adminUser.id, adminUser);

    // Create sample plants
    const plants: Plant[] = [
      {
        id: "plant-1",
        name: "Turmeric",
        scientificName: "Curcuma longa",
        description: "A flowering plant with distinctive golden-yellow rhizomes",
        uses: "Anti-inflammatory, wound healing, digestive aid",
        preparation: "Can be used fresh, dried, or powdered. Often made into paste or tea.",
        location: "Native to Southeast Asia",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
        verificationStatus: "verified",
        contributorId: user1.id,
        createdAt: new Date(),
      },
      {
        id: "plant-2",
        name: "Neem",
        scientificName: "Azadirachta indica",
        description: "A tree with compound leaves known for its medicinal properties",
        uses: "Antibacterial, skin conditions, pest control",
        preparation: "Leaves can be chewed fresh, made into paste, or boiled for tea.",
        location: "Indian subcontinent",
        imageUrl: "https://images.unsplash.com/photo-1599591640749-2dde4ff83e45",
        verificationStatus: "verified",
        contributorId: user2.id,
        createdAt: new Date(),
      },
      {
        id: "plant-3",
        name: "Ginger",
        scientificName: "Zingiber officinale",
        description: "A flowering plant whose rhizome is widely used as a spice",
        uses: "Nausea relief, digestive aid, cold remedy",
        preparation: "Fresh ginger can be sliced, grated, or juiced. Dried ginger powder for teas.",
        location: "Maritime Southeast Asia",
        imageUrl: "https://images.unsplash.com/photo-1596196535078-1997509de17d",
        verificationStatus: "verified",
        contributorId: user1.id,
        createdAt: new Date(),
      },
    ];

    plants.forEach(plant => this.plants.set(plant.id, plant));

    // Create sample contributions
    const contributions: Contribution[] = [
      {
        id: "contrib-1",
        plantId: "plant-1",
        contributorId: user1.id,
        contributorName: user1.name,
        type: "knowledge",
        content: "Traditional remedy for respiratory conditions and stress relief. Commonly used in Ayurvedic medicine.",
        status: "approved",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "contrib-2",
        plantId: "plant-3",
        contributorId: user2.id,
        contributorName: user2.name,
        type: "knowledge",
        content: "Nutritional powerhouse used for treating malnutrition. Leaves can be consumed fresh or dried.",
        status: "pending",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
    ];

    contributions.forEach(contrib => this.contributions.set(contrib.id, contrib));
    
    // Create sample discussions for unknown plants
    const discussions: Discussion[] = [
      {
        id: "discussion-1",
        identificationId: "unknown-plant-1",
        userId: user1.id,
        userRole: "expert",
        content: "This looks like it could be a variety of mint. The serrated leaves and square stem are characteristic.",
        isResolved: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        id: "discussion-2",
        identificationId: "unknown-plant-1",
        userId: user2.id,
        userRole: "user",
        content: "Thanks for the input! It does smell minty when crushed. Found it growing wild near a stream.",
        isResolved: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];
    
    discussions.forEach(discussion => this.discussions.set(discussion.id, discussion));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      badges: [],
      contributionCount: 0,
      language: insertUser.language || "en",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Plant operations
  async getPlant(id: string): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async getAllPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values())
      .filter(plant => plant.verificationStatus === "verified")
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getPlantsByStatus(status: string): Promise<Plant[]> {
    return Array.from(this.plants.values())
      .filter(plant => plant.verificationStatus === status)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async searchPlants(query: string): Promise<Plant[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.plants.values())
      .filter(plant => 
        plant.verificationStatus === "verified" && (
          plant.name.toLowerCase().includes(lowercaseQuery) ||
          plant.scientificName?.toLowerCase().includes(lowercaseQuery) ||
          plant.uses.toLowerCase().includes(lowercaseQuery) ||
          plant.description?.toLowerCase().includes(lowercaseQuery)
        )
      )
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = randomUUID();
    const plant: Plant = { 
      ...insertPlant, 
      id, 
      scientificName: insertPlant.scientificName || null,
      description: insertPlant.description || null,
      preparation: insertPlant.preparation || null,
      location: insertPlant.location || null,
      imageUrl: insertPlant.imageUrl || null,
      contributorId: insertPlant.contributorId || null,
      verificationStatus: "pending",
      createdAt: new Date() 
    };
    this.plants.set(id, plant);
    return plant;
  }

  async updatePlantStatus(id: string, status: string): Promise<Plant | undefined> {
    const plant = this.plants.get(id);
    if (plant) {
      plant.verificationStatus = status;
      this.plants.set(id, plant);
      return plant;
    }
    return undefined;
  }

  // Contribution operations
  async getContribution(id: string): Promise<Contribution | undefined> {
    return this.contributions.get(id);
  }

  async getContributionsByStatus(status: string): Promise<Contribution[]> {
    return Array.from(this.contributions.values())
      .filter(contrib => contrib.status === status)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getRecentContributions(limit: number = 10): Promise<Contribution[]> {
    return Array.from(this.contributions.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const id = randomUUID();
    const contribution: Contribution = { 
      ...insertContribution, 
      id, 
      plantId: insertContribution.plantId || null,
      contributorId: insertContribution.contributorId || null,
      status: "pending",
      createdAt: new Date() 
    };
    this.contributions.set(id, contribution);
    return contribution;
  }

  async updateContributionStatus(id: string, status: string): Promise<Contribution | undefined> {
    const contribution = this.contributions.get(id);
    if (contribution) {
      contribution.status = status;
      this.contributions.set(id, contribution);
      return contribution;
    }
    return undefined;
  }

  // Plant image operations
  async getPlantImages(plantId: string): Promise<PlantImage[]> {
    return Array.from(this.plantImages.values())
      .filter(image => image.plantId === plantId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createPlantImage(insertImage: InsertPlantImage): Promise<PlantImage> {
    const id = randomUUID();
    const image: PlantImage = { 
      ...insertImage, 
      id, 
      plantId: insertImage.plantId || null,
      description: insertImage.description || null,
      createdAt: new Date() 
    };
    this.plantImages.set(id, image);
    return image;
  }

  // Identification operations
  async createIdentification(insertIdentification: InsertIdentification): Promise<Identification> {
    const id = randomUUID();
    const identification: Identification = { 
      ...insertIdentification, 
      id, 
      plantId: insertIdentification.plantId || null,
      userId: insertIdentification.userId || null,
      isUnknown: insertIdentification.isUnknown || false,
      createdAt: new Date() 
    };
    this.identifications.set(id, identification);
    return identification;
  }

  async getRecentIdentifications(limit: number = 10): Promise<Identification[]> {
    return Array.from(this.identifications.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }
  
  async getUnknownIdentifications(): Promise<Identification[]> {
    return Array.from(this.identifications.values())
      .filter(identification => identification.isUnknown)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
  
  // Discussion operations
  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const id = randomUUID();
    const discussion: Discussion = { 
      ...insertDiscussion, 
      id, 
      identificationId: insertDiscussion.identificationId || null,
      userId: insertDiscussion.userId || null,
      userRole: insertDiscussion.userRole || "user",
      isResolved: false,
      createdAt: new Date() 
    };
    this.discussions.set(id, discussion);
    return discussion;
  }
  
  async getDiscussionsByIdentification(identificationId: string): Promise<Discussion[]> {
    return Array.from(this.discussions.values())
      .filter(discussion => discussion.identificationId === identificationId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }
  
  async updateDiscussionResolution(id: string, isResolved: boolean): Promise<Discussion | undefined> {
    const discussion = this.discussions.get(id);
    if (discussion) {
      discussion.isResolved = isResolved;
      this.discussions.set(id, discussion);
      return discussion;
    }
    return undefined;
  }
  
  // Voice recording operations
  async createVoiceRecording(insertRecording: InsertVoiceRecording): Promise<VoiceRecording> {
    const id = randomUUID();
    const recording: VoiceRecording = { 
      ...insertRecording, 
      id, 
      contributionId: insertRecording.contributionId || null,
      transcription: insertRecording.transcription || null,
      language: insertRecording.language || "en",
      duration: insertRecording.duration || null,
      createdAt: new Date() 
    };
    this.voiceRecordings.set(id, recording);
    return recording;
  }
  
  async getVoiceRecordingsByContribution(contributionId: string): Promise<VoiceRecording[]> {
    return Array.from(this.voiceRecordings.values())
      .filter(recording => recording.contributionId === contributionId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      userId: insertNotification.userId || null,
      plantId: insertNotification.plantId || null,
      status: "pending",
      createdAt: new Date() 
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
  
  async updateNotificationStatus(id: string, status: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.status = status;
      this.notifications.set(id, notification);
      return notification;
    }
    return undefined;
  }
  
  // User badge operations
  async addUserBadge(userId: string, badge: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      if (!user.badges?.includes(badge)) {
        user.badges = [...(user.badges || []), badge];
        this.users.set(userId, user);
      }
      return user;
    }
    return undefined;
  }
  
  async updateUserContributionCount(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.contributionCount = (user.contributionCount || 0) + 1;
      this.users.set(userId, user);
      
      // Award badges based on contribution count
      if (user.contributionCount === 1) {
        await this.addUserBadge(userId, "First Contribution");
      } else if (user.contributionCount === 5) {
        await this.addUserBadge(userId, "Active Contributor");
      } else if (user.contributionCount === 10) {
        await this.addUserBadge(userId, "Expert Contributor");
      }
      
      return user;
    }
    return undefined;
  }
  
  // Advanced search
  async searchPlantsBySymptom(symptom: string): Promise<Plant[]> {
    const lowercaseSymptom = symptom.toLowerCase();
    return Array.from(this.plants.values())
      .filter(plant => 
        plant.verificationStatus === "verified" && (
          plant.uses.toLowerCase().includes(lowercaseSymptom) ||
          plant.description?.toLowerCase().includes(lowercaseSymptom)
        )
      )
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
  
  async searchPlantsByRegion(region: string): Promise<Plant[]> {
    const lowercaseRegion = region.toLowerCase();
    return Array.from(this.plants.values())
      .filter(plant => 
        plant.verificationStatus === "verified" && 
        plant.location?.toLowerCase().includes(lowercaseRegion)
      )
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

// Use database storage in production, memory storage for development
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
