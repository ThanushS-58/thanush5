import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertPlantSchema, insertContributionSchema, insertIdentificationSchema, insertDiscussionSchema, insertVoiceRecordingSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // For demo purposes, we'll do simple email-based lookup
      // In production, this would include proper password hashing and verification
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // For demo: accept any password for existing users, or specific demo passwords
      const validDemoPasswords = {
        'maya@example.com': 'demo123',
        'admin@mediplant.ai': 'admin123',
        'ravi@example.com': 'demo123'
      };
      
      const expectedPassword = validDemoPasswords[email as keyof typeof validDemoPasswords];
      if (expectedPassword && password !== expectedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Remove sensitive data before sending
      const { ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, username, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        name,
        email,
        username,
        language: "en",
        badges: [],
        contributionCount: 0,
        isAdmin: false,
      });
      
      // Remove sensitive data before sending
      const { ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });
  // Get all verified plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getAllPlants();
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  // Search plants
  app.get("/api/plants/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const plants = await storage.searchPlants(query);
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: "Failed to search plants" });
    }
  });

  // Get plant by ID
  app.get("/api/plants/:id", async (req, res) => {
    try {
      const plant = await storage.getPlant(req.params.id);
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plant" });
    }
  });

  // Create new plant contribution
  app.post("/api/plants", async (req, res) => {
    try {
      const validatedData = insertPlantSchema.parse(req.body);
      const plant = await storage.createPlant(validatedData);
      res.status(201).json(plant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plant data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create plant" });
    }
  });

  // Plant identification with image upload
  app.post("/api/identify", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Mock AI identification - in production, this would call an ML model
      const mockIdentifications = [
        { plantId: "plant-1", confidence: 95, name: "Turmeric", scientificName: "Curcuma longa" },
        { plantId: "plant-2", confidence: 87, name: "Neem", scientificName: "Azadirachta indica" },
        { plantId: "plant-3", confidence: 92, name: "Ginger", scientificName: "Zingiber officinale" },
      ];

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pick a random identification for demo
      const identification = mockIdentifications[Math.floor(Math.random() * mockIdentifications.length)];
      
      // Get full plant details
      const plant = await storage.getPlant(identification.plantId);
      if (!plant) {
        return res.status(500).json({ message: "Plant data not found" });
      }

      // Create identification record
      const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      await storage.createIdentification({
        imageUrl,
        plantId: identification.plantId,
        confidence: identification.confidence,
        userId: null, // Anonymous identification
      });

      res.json({
        plant,
        confidence: identification.confidence,
        imageUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to identify plant" });
    }
  });

  // Get contributions by status
  app.get("/api/contributions", async (req, res) => {
    try {
      const status = req.query.status as string;
      const contributions = status 
        ? await storage.getContributionsByStatus(status)
        : await storage.getRecentContributions();
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  // Create new contribution
  app.post("/api/contributions", async (req, res) => {
    try {
      const validatedData = insertContributionSchema.parse(req.body);
      const contribution = await storage.createContribution(validatedData);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contribution data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  // Update contribution status (moderation)
  app.patch("/api/contributions/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const contribution = await storage.updateContributionStatus(req.params.id, status);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }
      
      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution status" });
    }
  });

  // Get app statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allPlants = await storage.getAllPlants();
      const allContributions = await storage.getRecentContributions(1000);
      const identifications = await storage.getRecentIdentifications(1000);
      
      const stats = {
        plantsIdentified: identifications.length,
        contributors: new Set(allContributions.map(c => c.contributorId)).size,
        knowledgeEntries: allContributions.filter(c => c.status === 'approved').length,
        languagesSupported: 12, // Static for now
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  
  // Advanced search endpoints
  app.get("/api/plants/search-by-symptom", async (req, res) => {
    try {
      const symptom = req.query.symptom as string;
      if (!symptom || symptom.length < 2) {
        return res.json([]);
      }
      const plants = await storage.searchPlantsBySymptom(symptom);
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: "Failed to search plants by symptom" });
    }
  });
  
  app.get("/api/plants/search-by-region", async (req, res) => {
    try {
      const region = req.query.region as string;
      if (!region || region.length < 2) {
        return res.json([]);
      }
      const plants = await storage.searchPlantsByRegion(region);
      res.json(plants);
    } catch (error) {
      res.status(500).json({ message: "Failed to search plants by region" });
    }
  });
  
  // Unknown plant discussions
  app.get("/api/unknown-plants", async (req, res) => {
    try {
      const unknownPlants = await storage.getUnknownIdentifications();
      res.json(unknownPlants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unknown plants" });
    }
  });
  
  app.get("/api/discussions/:identificationId", async (req, res) => {
    try {
      const discussions = await storage.getDiscussionsByIdentification(req.params.identificationId);
      res.json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });
  
  app.post("/api/discussions", async (req, res) => {
    try {
      const validatedData = insertDiscussionSchema.parse(req.body);
      const discussion = await storage.createDiscussion(validatedData);
      res.status(201).json(discussion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid discussion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });
  
  // Voice recording endpoints
  app.post("/api/voice-recordings", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      const audioUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const validatedData = insertVoiceRecordingSchema.parse({
        ...req.body,
        audioUrl,
        duration: parseInt(req.body.duration || '0'),
      });
      
      const recording = await storage.createVoiceRecording(validatedData);
      res.status(201).json(recording);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid voice recording data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save voice recording" });
    }
  });
  
  app.get("/api/voice-recordings/:contributionId", async (req, res) => {
    try {
      const recordings = await storage.getVoiceRecordingsByContribution(req.params.contributionId);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voice recordings" });
    }
  });
  
  // Notification endpoints
  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      
      // TODO: Integrate with actual messaging services (WhatsApp, SMS, etc.)
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });
  
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // User badge operations
  app.post("/api/users/:userId/badges", async (req, res) => {
    try {
      const { badge } = req.body;
      if (!badge) {
        return res.status(400).json({ message: "Badge name is required" });
      }
      
      const user = await storage.addUserBadge(req.params.userId, badge);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to add user badge" });
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Get all users (admin only in production)
  app.get("/api/users", async (req, res) => {
    try {
      // In production, this would check for admin privileges
      const users = Array.from((storage as any).users.values());
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Admin endpoints
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = {
        totalUsers: (storage as any).users.size,
        totalPlants: (storage as any).plants.size,
        totalContributions: (storage as any).contributions.size,
        pendingReviews: 0
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  
  app.get("/api/admin/pending-contributions", async (req, res) => {
    try {
      // Mock pending contributions for demo
      const pending = [];
      res.json(pending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending contributions" });
    }
  });
  
  app.get("/api/admin/reported-content", async (req, res) => {
    try {
      // Mock reported content for demo
      const reported = [];
      res.json(reported);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reported content" });
    }
  });
  
  app.post("/api/admin/moderate", async (req, res) => {
    try {
      const { id, action, type } = req.body;
      // In production, this would perform actual moderation
      res.json({ success: true, message: `Content ${action}ed successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to moderate content" });
    }
  });
  
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isAdmin } = req.body;
      // In production, this would update user role in database
      res.json({ success: true, message: "User role updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // WhatsApp integration endpoints
  app.get("/api/whatsapp/messages", async (req, res) => {
    try {
      // Mock WhatsApp messages for demo
      const messages = [];
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });
  
  app.get("/api/whatsapp/stats", async (req, res) => {
    try {
      const stats = {
        messagesReceived: 0,
        plantsIdentified: 0,
        activeUsers: 0,
        responseTime: "< 1s"
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp stats" });
    }
  });
  
  app.post("/api/whatsapp/activate", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      // In production, this would configure WhatsApp Business API
      res.json({ success: true, message: "WhatsApp integration activated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate WhatsApp integration" });
    }
  });
  
  app.post("/api/whatsapp/test-message", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      // In production, this would send actual WhatsApp message
      res.json({ success: true, message: "Test message sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send test message" });
    }
  });
  
  // Communication endpoints (SMS/Voice)
  app.get("/api/communication/settings", async (req, res) => {
    try {
      const settings = {
        twilioEnabled: false,
        phoneNumber: "",
        smsEnabled: false,
        voiceEnabled: false,
        emergencyContacts: []
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication settings" });
    }
  });
  
  app.get("/api/communication/history", async (req, res) => {
    try {
      // Mock communication history for demo
      const history = [];
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication history" });
    }
  });
  
  app.post("/api/communication/send", async (req, res) => {
    try {
      const { phoneNumber, message, type } = req.body;
      // In production, this would use Twilio API to send SMS or make voice calls
      res.json({ success: true, message: `${type} sent successfully` });
    } catch (error) {
      res.status(500).json({ message: `Failed to send ${req.body.type}` });
    }
  });
  
  app.post("/api/communication/configure", async (req, res) => {
    try {
      const settings = req.body;
      // In production, this would save communication settings to database
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  
  // Plant gallery endpoints
  app.get("/api/plant-images", async (req, res) => {
    try {
      // Mock plant images for demo
      const images = [];
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plant images" });
    }
  });
  
  app.get("/api/plant-images/:plantId", async (req, res) => {
    try {
      const { plantId } = req.params;
      // Mock plant images for specific plant
      const images = [];
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plant images" });
    }
  });
  
  app.post("/api/plant-images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // In production, this would upload to cloud storage and save metadata
      const imageData = {
        id: `img-${Date.now()}`,
        plantId: req.body.plantId || 'unknown',
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        uploadedBy: 'Anonymous User',
        uploadDate: new Date().toISOString(),
        likes: 0,
        isVerified: false,
        partOfPlant: 'whole',
        tags: []
      };
      
      res.json({ success: true, image: imageData });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  app.post("/api/plant-images/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      // In production, this would update like count in database
      res.json({ success: true, message: "Image liked" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
