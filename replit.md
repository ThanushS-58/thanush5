# MediPlant AI

## Overview

MediPlant AI is a full-stack web application designed to preserve and share traditional medicinal plant knowledge through AI-powered plant identification and community collaboration. The system allows users to upload plant images for AI identification, search an extensive knowledge base of medicinal plants, contribute their own traditional knowledge, and access information through text-to-speech functionality. The platform bridges modern technology with traditional healing wisdom by enabling community members and healers to document and share their plant knowledge in a structured, accessible format.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a React single-page application using TypeScript and modern tooling:
- **React 18** with functional components and hooks for state management
- **Vite** as the build tool and development server for fast compilation and hot reloading
- **Tailwind CSS** with custom design system for consistent, responsive styling
- **Shadcn/ui components** providing accessible, pre-built UI components with Radix UI primitives
- **React Query (TanStack Query)** for server state management, caching, and API synchronization
- **React Hook Form** with Zod validation for type-safe form handling
- **Wouter** as a lightweight client-side routing solution

The application follows a component-based architecture with reusable UI components, centralized state management through React Query, and a mobile-first responsive design approach.

### Backend Architecture
The backend implements a REST API using Node.js and Express:
- **Express.js** server with TypeScript for type safety and modern JavaScript features
- **Modular route organization** separating API endpoints by functionality
- **Multer middleware** for handling file uploads with size limits and type validation
- **In-memory storage layer** with interface abstraction for easy database migration
- **Comprehensive error handling** and request/response logging middleware

The backend is designed with a clean separation of concerns, making it easy to swap storage implementations or add new features.

### Data Storage Solutions
Currently uses an in-memory storage system with a well-defined interface:
- **Storage abstraction layer** (IStorage interface) allowing easy migration to persistent databases
- **Structured data models** for users, plants, contributions, images, and identifications
- **Status-based workflows** for content moderation and verification
- **Drizzle ORM configuration** prepared for PostgreSQL migration with schema definitions

The storage layer supports plant verification workflows, user contribution tracking, and image management with metadata.

### Authentication and Authorization
The application currently operates without authentication but includes:
- **User model structure** ready for authentication implementation
- **Admin role support** in the database schema for content moderation
- **Contributor tracking** for knowledge attribution and community recognition

### Voice and Accessibility Features
Integrated text-to-speech functionality for accessibility:
- **Web Speech API integration** using browser-native speech synthesis
- **Customizable voice settings** with rate, pitch, and volume controls
- **Cross-browser compatibility** with fallback error handling
- **Audio controls** throughout the interface for plant information playback

### File Upload and Processing
Robust file handling system for plant images:
- **Image upload validation** with file type and size restrictions
- **Memory-based storage** with base64 encoding for images
- **Drag-and-drop interface** with visual feedback for user uploads
- **Prepared for AI integration** with placeholder identification endpoints

## External Dependencies

### Core Technologies
- **Node.js and Express** for server runtime and web framework
- **React and TypeScript** for frontend development with type safety
- **Vite** for build tooling and development experience
- **Tailwind CSS** for utility-first styling approach

### UI and Design System
- **Shadcn/ui component library** providing accessible, customizable components
- **Radix UI primitives** for unstyled, accessible component foundations
- **Lucide React** for consistent iconography throughout the application
- **Class Variance Authority** for component variant management

### Database and ORM
- **Drizzle ORM** configured for PostgreSQL with type-safe database operations
- **Drizzle Kit** for database migrations and schema management
- **Neon Database** serverless PostgreSQL ready for deployment
- **Prepared schemas** for all data models with proper relationships

### Development and Build Tools
- **ESBuild** for fast server-side bundling in production
- **PostCSS and Autoprefixer** for CSS processing and browser compatibility
- **React Query** for efficient server state management and caching

### Future Integration Points
The application is architected to easily integrate:
- **AI/ML services** for plant identification using uploaded images
- **Authentication providers** through the prepared user management system
- **Cloud storage services** for scalable image storage and processing
- **Voice recognition APIs** for voice-based plant knowledge contributions
- **Notification systems** for community engagement and moderation workflows