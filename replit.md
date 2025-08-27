# Flight Booking System

## Overview

A full-stack flight booking application built with TypeScript, featuring a Node.js/Express backend API and React frontend. The system provides comprehensive flight search, booking management, and user profile functionality with both in-memory storage for development and PostgreSQL database support for production. The application follows modern architectural patterns with comprehensive validation, error handling, and a component-based UI built with shadcn/ui.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety and modern JavaScript features
- **Storage Layer**: Dual storage approach with MemStorage for development/testing and PostgreSQL with Drizzle ORM for production
- **API Design**: RESTful endpoints following resource-based URL patterns with comprehensive CRUD operations
- **Validation**: Zod schemas for runtime type validation and data sanitization at API boundaries
- **Error Handling**: Centralized error handling middleware with structured error responses and detailed logging
- **Controllers**: Organized by domain (FlightController, BookingController, UserController) following single responsibility principle

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Form Handling**: React Hook Form with Zod resolvers for type-safe form validation

### Data Layer
- **Database**: PostgreSQL with UUID primary keys for scalability
- **ORM**: Drizzle ORM with type-safe queries and migrations
- **Schema**: Well-normalized relational design with proper foreign key constraints
- **Development Storage**: In-memory storage implementation for rapid prototyping and testing
- **Data Validation**: Shared Zod schemas between frontend and backend for consistent validation rules

### Development Workflow
- **Build System**: Vite for frontend bundling with ESBuild for backend compilation
- **Type Safety**: Strict TypeScript configuration with path mapping for clean imports
- **Development Server**: Express with Vite middleware integration for full-stack development
- **Code Organization**: Monorepo structure with shared schemas and utilities

### Security & Performance
- **CORS Configuration**: Configurable CORS settings for frontend integration
- **Input Validation**: Comprehensive request validation with detailed error messages
- **Logging**: Structured logging with different levels for debugging and monitoring
- **Error Boundaries**: Graceful error handling with user-friendly error messages

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary database with Neon serverless hosting support
- **Drizzle ORM**: Type-safe database operations with migration support
- **Drizzle Kit**: Database migration and schema management tools

### Backend Dependencies
- **Express.js**: Web application framework with CORS middleware
- **Zod**: Runtime type validation and schema definition
- **UUID**: Unique identifier generation for database records

### Frontend Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Icons**: Lucide React for consistent iconography

### Development Tools
- **Build Tools**: Vite with React plugin and TypeScript support
- **Development Utilities**: Replit-specific plugins for enhanced development experience
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Styling Tools**: PostCSS with Tailwind CSS and Autoprefixer