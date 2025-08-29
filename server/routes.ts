import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertPlantSchema, insertContributionSchema, insertIdentificationSchema } from "@shared/schema";
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
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
