import { Plant, Contribution } from "@shared/schema";

export const mockPlants: Plant[] = [
  {
    id: "plant-1",
    name: "Turmeric",
    scientificName: "Curcuma longa",
    description: "A flowering plant with distinctive golden-yellow rhizomes used extensively in traditional medicine",
    uses: "Anti-inflammatory, wound healing, digestive aid, antimicrobial properties",
    preparation: "Can be used fresh, dried, or powdered. Often made into paste, tea, or consumed with milk",
    location: "Native to Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    verificationStatus: "verified",
    contributorId: "user-1",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "plant-2",
    name: "Neem",
    scientificName: "Azadirachta indica",
    description: "A tree with compound leaves known for its powerful medicinal and pest control properties",
    uses: "Antibacterial, antifungal, skin conditions, dental care, pest control",
    preparation: "Leaves can be chewed fresh, made into paste, boiled for tea, or oil extracted",
    location: "Indian subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1599591640749-2dde4ff83e45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    verificationStatus: "verified",
    contributorId: "user-2",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "plant-3",
    name: "Ginger",
    scientificName: "Zingiber officinale",
    description: "A flowering plant whose rhizome is widely used as a spice and traditional medicine",
    uses: "Nausea relief, digestive aid, cold remedy, anti-inflammatory",
    preparation: "Fresh ginger can be sliced, grated, juiced, or dried. Often used in teas and cooking",
    location: "Maritime Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1596196535078-1997509de17d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    verificationStatus: "verified",
    contributorId: "user-1",
    createdAt: new Date("2024-01-05"),
  },
];

export const mockContributions: Contribution[] = [
  {
    id: "contrib-1",
    plantId: "plant-1",
    contributorId: "user-1",
    contributorName: "Dr. Maya Patel",
    type: "knowledge",
    content: "Traditional remedy for respiratory conditions and stress relief. Commonly used in Ayurvedic medicine for its anti-inflammatory properties.",
    status: "approved",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "contrib-2",
    plantId: "plant-3",
    contributorId: "user-2", 
    contributorName: "Ravi Kumar",
    type: "knowledge",
    content: "Nutritional powerhouse used for treating malnutrition. Leaves can be consumed fresh or dried. Excellent source of vitamins and minerals.",
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: "contrib-3",
    plantId: "plant-2",
    contributorId: "user-3",
    contributorName: "Priya Sharma",
    type: "knowledge", 
    content: "Used traditionally for skin ailments and as a natural pesticide. The bark and leaves have strong antimicrobial properties.",
    status: "approved",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
];

export const mockStats = {
  plantsIdentified: 2847,
  contributors: 156,
  knowledgeEntries: 834,
  languagesSupported: 12,
};
