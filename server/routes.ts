import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertPlantSchema, insertContributionSchema, insertIdentificationSchema, insertDiscussionSchema, insertVoiceRecordingSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { classifyPlantImage, searchPlantKnowledge, generateSpeech, generateElevenLabsSpeech, generateGoogleCloudSpeech, identifyPlantWithDatabase, translatePlantInfo } from "./ai-services";
import { sendSMSNotification, makeEmergencyCall, sendPlantCareReminder, sendWhatsAppMessage } from "./communication-services";
import { loadPlantDatabase, searchPlantsByName, searchPlantsByUse, getRandomPlants, getPlantByName } from "./csv-loader";

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

  // Advanced AI plant identification with image upload
  app.post("/api/identify", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
      
      // Use AI classification service
      const aiResult = await classifyPlantImage(imageBase64);
      
      // Create or find plant in database
      let plant = await storage.searchPlants(aiResult.plant.name).then(plants => plants[0]);
      
      if (!plant) {
        // Create new plant entry from AI analysis
        plant = await storage.createPlant({
          name: aiResult.plant.name,
          scientificName: aiResult.plant.scientificName,
          description: aiResult.analysis,
          uses: aiResult.plant.medicinalUses.join(', '),
          preparation: 'Fresh use, dried, tea preparation',
          location: aiResult.plant.region.join(', '),
          verificationStatus: 'pending',
          contributorId: req.body.userId || null
        });
      }

      // Create identification record
      const identification = await storage.createIdentification({
        imageUrl,
        plantId: plant.id,
        confidence: aiResult.plant.confidence,
        userId: req.body.userId || null,
        isUnknown: aiResult.plant.confidence < 70
      });

      // Send safety alerts if dangerous plant detected
      if (aiResult.plant.safetyWarnings.length > 0 && req.body.phoneNumber) {
        const dangerLevel = aiResult.plant.safetyWarnings.some(w => 
          w.toLowerCase().includes('toxic') || w.toLowerCase().includes('poison')
        ) ? 'danger' : 'warning';
        
        await sendSMSNotification(
          req.body.phoneNumber,
          `Plant identification alert: ${aiResult.plant.name} - ${aiResult.plant.safetyWarnings.join(', ')}`,
          dangerLevel === 'danger'
        );
      }

      res.json({
        plant,
        confidence: aiResult.plant.confidence,
        imageUrl,
        analysis: aiResult.analysis,
        safetyWarnings: aiResult.plant.safetyWarnings,
        identificationId: identification.id
      });
    } catch (error) {
      console.error('Plant identification error:', error);
      res.status(500).json({ message: "Failed to identify plant" });
    }
  });

  // Enhanced plant identification with database integration
  app.post("/api/plants/identify-enhanced", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const plantDatabase = loadPlantDatabase();
      
      // Get enhanced identification with database matching and filename hints
      const result = await identifyPlantWithDatabase(imageBase64, plantDatabase, req.file.originalname);
      
      // Store the identification (without plant_id since we don't have plants in database yet)
      const identification = await storage.createIdentification({
        imageUrl: `data:image/jpeg;base64,${imageBase64}`,
        confidence: result.confidence,
        isUnknown: result.confidence < 60
      });

      // Translate if requested
      const language = req.body.language || 'en';
      let translatedPlant = result.plant;
      if (language !== 'en') {
        translatedPlant = await translatePlantInfo(result.plant, language);
      }

      res.json({
        plant: translatedPlant,
        confidence: result.confidence,
        imageUrl: `data:${req.file.mimetype};base64,${imageBase64}`,
        analysis: result.analysis,
        alternativeMatches: result.alternativeMatches,
        identificationId: identification.id,
        databaseMatch: result.confidence > 50,
        visualFeatures: result.visualFeatures || undefined
      });
    } catch (error) {
      console.error('Enhanced plant identification error:', error);
      res.status(500).json({ message: "Failed to identify plant with enhanced method" });
    }
  });

  // Text-to-Speech endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, language = 'en', provider = 'auto' } = req.body;
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "No text provided" });
      }

      if (text.length > 1000) {
        return res.status(400).json({ message: "Text too long (max 1000 characters)" });
      }

      // Use appropriate TTS service based on provider preference
      let audioBuffer = null;
      
      if (provider === 'elevenlabs' || provider === 'auto') {
        // Try ElevenLabs first (free tier, no billing required)
        audioBuffer = await generateElevenLabsSpeech(text, language);
      }
      
      if (!audioBuffer && (provider === 'google' || provider === 'auto')) {
        // Try Google Cloud TTS (requires billing)
        audioBuffer = await generateGoogleCloudSpeech(text, language);
      }
      
      if (!audioBuffer && (provider === 'openai' || provider === 'auto')) {
        // Fallback to OpenAI TTS
        audioBuffer = await generateSpeech(text, language);
      }
      
      if (!audioBuffer) {
        return res.status(503).json({ message: "Text-to-speech service unavailable" });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(audioBuffer);
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // Search plants from CSV database
  app.get("/api/database/search", async (req, res) => {
    try {
      const { q: query, type = 'name' } = req.query;
      
      if (!query || (query as string).length < 2) {
        return res.json([]);
      }

      let results;
      if (type === 'use') {
        results = searchPlantsByUse(query as string);
      } else {
        results = searchPlantsByName(query as string);
      }

      res.json(results);
    } catch (error) {
      console.error('Database search error:', error);
      res.status(500).json({ message: "Failed to search plant database" });
    }
  });

  // Get random plants from database
  app.get("/api/database/random", async (req, res) => {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 10, 50);
      const randomPlants = getRandomPlants(count);
      res.json(randomPlants);
    } catch (error) {
      console.error('Random plants error:', error);
      res.status(500).json({ message: "Failed to get random plants" });
    }
  });

  // Get specific plant from database
  app.get("/api/database/plant/:name", async (req, res) => {
    try {
      const plant = getPlantByName(req.params.name);
      if (!plant) {
        return res.status(404).json({ message: "Plant not found in database" });
      }
      
      // Translate if requested
      const language = req.query.language as string || 'en';
      let translatedPlant = plant;
      if (language !== 'en') {
        translatedPlant = await translatePlantInfo(plant, language);
      }
      
      res.json(translatedPlant);
    } catch (error) {
      console.error('Get plant error:', error);
      res.status(500).json({ message: "Failed to get plant from database" });
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
        plantsIdentified: identifications.filter(i => !i.isUnknown).length,
        contributors: new Set(allContributions.map(c => c.contributorId)).size,
        knowledgeEntries: allContributions.filter(c => c.status === 'approved').length,
        languagesSupported: 12,
        aiClassifications: identifications.filter(i => i.confidence && i.confidence > 70).length,
        safetyAlerts: identifications.filter(i => i.confidence && i.confidence > 80).length,
        databaseEntries: allPlants.length
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
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
  
  // Advanced AI knowledge search
  app.post("/api/search-knowledge", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query too short" });
      }
      
      const aiResult = await searchPlantKnowledge(query);
      const dbResults = await storage.searchPlants(query);
      
      res.json({
        aiSuggestions: aiResult.suggestions,
        relatedPlants: aiResult.relatedPlants,
        usageGuidance: aiResult.usageGuidance,
        databaseResults: dbResults
      });
    } catch (error) {
      console.error('Knowledge search error:', error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });
  
  // Emergency communication endpoints
  app.post("/api/emergency-alert", async (req, res) => {
    try {
      const { phoneNumber, plantName, dangerLevel, messageType } = req.body;
      
      if (!phoneNumber || !plantName) {
        return res.status(400).json({ message: "Phone number and plant name required" });
      }
      
      let result;
      if (messageType === 'call') {
        result = await makeEmergencyCall(phoneNumber, plantName, dangerLevel || 'warning');
      } else {
        const message = `Emergency plant alert: ${plantName}. ${dangerLevel === 'danger' ? 'Seek immediate medical attention if consumed.' : 'Exercise caution and consult medical professionals.'}`;
        result = await sendSMSNotification(phoneNumber, message, true);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Emergency alert error:', error);
      res.status(500).json({ message: "Failed to send emergency alert" });
    }
  });
  
  // Plant care reminder system
  app.post("/api/care-reminder", async (req, res) => {
    try {
      const { phoneNumber, plantName, careType, scheduleTime } = req.body;
      
      if (!phoneNumber || !plantName || !careType) {
        return res.status(400).json({ message: "Phone number, plant name and care type required" });
      }
      
      const result = await sendPlantCareReminder(phoneNumber, plantName, careType);
      
      // Store reminder in database
      await storage.createNotification({
        userId: req.body.userId || 'anonymous',
        type: 'care_reminder',
        title: `${careType} reminder for ${plantName}`,
        message: `Time to ${careType} your ${plantName}`,
        status: 'sent',
        scheduledFor: scheduleTime ? new Date(scheduleTime) : new Date()
      });
      
      res.json(result);
    } catch (error) {
      console.error('Care reminder error:', error);
      res.status(500).json({ message: "Failed to send care reminder" });
    }
  });
  
  // WhatsApp integration endpoints
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message required" });
      }
      
      const result = await sendWhatsAppMessage(phoneNumber, message);
      res.json(result);
    } catch (error) {
      console.error('WhatsApp error:', error);
      res.status(500).json({ message: "Failed to send WhatsApp message" });
    }
  });
  
  app.get("/api/whatsapp/messages", async (req, res) => {
    try {
      // Mock WhatsApp messages for demo
      const messages: any[] = [];
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch WhatsApp messages" });
    }
  });
  
  app.get("/api/whatsapp/stats", async (req, res) => {
    try {
      const identifications = await storage.getRecentIdentifications(1000);
      const stats = {
        messagesReceived: identifications.length,
        plantsIdentified: identifications.filter(i => !i.isUnknown).length,
        activeUsers: new Set(identifications.map(i => i.userId).filter(Boolean)).size,
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
        twilioEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
        smsEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        voiceEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        openaiEnabled: !!process.env.OPENAI_API_KEY,
        emergencyContacts: []
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication settings" });
    }
  });
  
  app.get("/api/communication/history", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (userId) {
        const notifications = await storage.getNotificationsByUser(userId);
        res.json(notifications);
      } else {
        // Return recent system notifications
        const history: any[] = [];
        res.json(history);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication history" });
    }
  });
  
  app.post("/api/communication/send", async (req, res) => {
    try {
      const { phoneNumber, message, type } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message required" });
      }
      
      let result;
      if (type === 'sms') {
        result = await sendSMSNotification(phoneNumber, message);
      } else if (type === 'whatsapp') {
        result = await sendWhatsAppMessage(phoneNumber, message);
      } else {
        return res.status(400).json({ message: "Invalid communication type" });
      }
      
      // Log communication in database
      if (req.body.userId) {
        await storage.createNotification({
          userId: req.body.userId,
          type: 'communication',
          title: `${type.toUpperCase()} sent`,
          message: `Message sent to ${phoneNumber}`,
          status: result.success ? 'delivered' : 'failed'
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Communication error:', error);
      res.status(500).json({ message: `Failed to send ${req.body.type}` });
    }
  });
  
  app.post("/api/communication/configure", async (req, res) => {
    try {
      const { userId, settings } = req.body;
      
      // In production, this would save communication settings to database
      if (userId) {
        await storage.createNotification({
          userId,
          type: 'system',
          title: 'Communication settings updated',
          message: 'Your communication preferences have been saved',
          status: 'delivered'
        });
      }
      
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error('Settings update error:', error);
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

  // Download static website endpoint
  app.get("/api/download-static", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const staticFilePath = path.resolve(import.meta.dirname, "..", "github-pages-website-fixed.tar.gz");
      
      if (!fs.existsSync(staticFilePath)) {
        return res.status(404).json({ message: "Static website file not found" });
      }
      
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="mediplant-github-pages-website.tar.gz"');
      
      const fileStream = fs.createReadStream(staticFilePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to download static website" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
