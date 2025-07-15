# Royal Aviator - Crypto Casino Platform

## Overview

Royal Aviator is a comprehensive crypto casino platform built as a full-stack web application featuring an Aviator crash game and slot machine games. The platform integrates with NOWPayments for cryptocurrency transactions and uses a modern tech stack with React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom casino-themed design system
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: Node.js crypto module with scrypt hashing
- **WebSocket**: Native WebSocket implementation for real-time Aviator game

### Database Architecture
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL via connection pooling

## Key Components

### Authentication System
- Local authentication strategy using username/password
- Session-based authentication with PostgreSQL session store
- Protected routes with middleware-based authorization
- Admin role-based access control

### Game Engine
- **Aviator Game**: Real-time crash game with provably fair mechanics
- **Slot Games**: Collection of themed slot machines with RTP configuration
- **Demo Mode**: Risk-free gaming with virtual balance
- **WebSocket Integration**: Real-time game state updates
- **Audio System**: Disabled per user preference
  - All sound effects removed from the application
  - Silent gaming experience maintained throughout

### Payment System
- **NOWPayments Integration**: Cryptocurrency deposit/withdrawal processing
- **Multi-currency Support**: Bitcoin, Ethereum, and other cryptocurrencies
- **Transaction Management**: Comprehensive transaction history and status tracking
- **Balance Management**: Separate real and demo balance tracking

### User Management
- User registration with email, phone, and username validation
- Profile management with balance tracking
- Transaction history and game statistics
- Admin dashboard for platform management

## Data Flow

### Game Flow
1. User connects to WebSocket for real-time game updates
2. Game state broadcasts to all connected clients
3. User places bets through API endpoints
4. Game results calculated server-side with provably fair algorithms
5. Balance updates processed atomically in database

### Payment Flow
1. User initiates deposit/withdrawal through dashboard
2. NOWPayments API creates payment request
3. Webhook notifications update transaction status
4. Balance updates processed upon payment confirmation
5. Transaction history updated in real-time

### Authentication Flow
1. User submits credentials through login form
2. Passport.js validates against database
3. Session created and stored in PostgreSQL
4. Protected routes check session validity
5. User context provided throughout application

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **passport**: Authentication middleware
- **express-session**: Session management
- **bcrypt**: Password hashing (legacy, replaced by crypto)

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library

### Payment Integration
- **NOWPayments API**: Cryptocurrency payment processing
- **WebSocket**: Real-time game state synchronization

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **API Server**: Express server with live reload via tsx
- **Database**: Development PostgreSQL instance
- **WebSocket**: Development WebSocket server

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles Express server for production
- **Database**: Production PostgreSQL with connection pooling
- **Static Assets**: Served from dist/public directory

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **NODE_ENV**: Environment mode (development/production)
- **NOWPAYMENTS_API_KEY**: Payment processor credentials

The application follows a monorepo structure with shared TypeScript schemas, separate client and server directories, and comprehensive type safety throughout the stack. The architecture supports real-time gaming, secure transactions, and scalable user management.