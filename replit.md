# Salva Plantão

## Overview

Salva Plantão is a comprehensive medical application designed for physicians working shifts (plantonistas). It provides essential tools for medical professionals including prescription management, clinical protocols, checklists, shift scheduling with financial tracking, AI-powered medical consultations, and educational resources. The app features a two-tier access system with regular users (physicians) and administrators, with payment-gated premium features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical-themed color palette ("Salva Plantão Blue")
- **Animations**: Framer Motion for page transitions and UI feedback
- **Charts**: Recharts for financial visualization

The frontend follows a protected route pattern where authenticated users are wrapped in a layout containing the sidebar navigation and floating calculator. Payment status is checked at the route level, redirecting non-paying users to a payment screen.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

The server uses a modular integration pattern with reusable modules under `server/replit_integrations/` for auth, chat, image handling, and batch processing.

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Migrations**: Managed via drizzle-kit with `db:push` command

Key database entities include: prescriptions, protocols, checklists, shifts, notes, handovers, flashcards, library items, doctor profiles, admin settings, drug interactions, medication contraindications, calculator settings, and prescription favorites. The schema supports multi-tenant access with `userId` foreign keys and `isPublic`/`isLocked` flags for admin-controlled content.

### Version 2 Features (January 2026)
- **SUS Prescription Printing**: Two-copy format with preview dialog, patient info fields, and doctor profile integration
- **Prescription Favorites**: Users can save official medications as personal favorites with custom edits
- **Prescription Sharing**: Token-based secure sharing between users with ownership validation
- **Drug Interactions**: Quick checker with severity levels (leve, moderada, grave, contraindicada)
- **Medication Contraindications**: Admin-configurable contraindications per medication
- **Enhanced Pediatric Calculator**: Age input, pharmaceutical forms, concentration display, age/weight warnings
- **Orientations Field**: "Orientações / Sinais de Alarme" field added to all prescriptions
- **Prescription Models by Pathology**: Admin-created official prescription templates organized by pathology, with multiple medications, orientations, and clinical observations per model
- **AI Assistant for Content Generation** (Admin only): Generates prescription model drafts using OpenAI, with preview/edit before saving - never auto-saves
- **Enhanced Calculator Settings**: Extended database schema with dose formulas, usage modes (home/unit), multiple routes (IV/IM/SC), dilution info, and available pharmaceutical forms

### Version 2.1 Features (January 2026)
- **Calculator Allowed Meds**: Admin controls which medications appear in the quick calculator for each patient type (pediatric/adult)
- **Dashboard/Quick Access Config**: Admin can configure custom dashboard items and quick access shortcuts for users
- **Donation System**: Donation causes management with destination types (PIX, Bank, Link, Internal), target amounts, and donation tracking
- **Enhanced Medications Library**: Age group tabs (Todos/Adulto/Pediatria/Ambos), category filter, search, and batch selection mode
- **Batch Operations**: Select multiple medications to activate, deactivate, delete, or export as CSV/JSON
- **Pathology Medication Filter**: Filter medications by age group when assigning to pathologies

### Authentication & Authorization
- **Auth Provider**: Replit Auth (OIDC)
- **User Roles**: `user` (default) and `admin`
- **User Status**: `pending`, `active`, `blocked`
- **Payment Model**: Manual Pix payment verification by admin

Admin users bypass payment checks and have access to user management, content moderation, and system settings. The admin panel allows activating/blocking users and managing official content templates.

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Custom build script using esbuild for server bundling and Vite for client
- **Output**: Server bundle at `dist/index.cjs`, client assets at `dist/public/`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: Powers the medical AI chat assistant
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Used for clinical decision support and medical Q&A

### Authentication
- **Replit OIDC**: OAuth2/OpenID Connect provider
  - Requires `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables

### Third-Party Libraries
- **Radix UI**: Accessible UI primitives for dialogs, dropdowns, tabs, etc.
- **date-fns**: Date formatting and manipulation (Portuguese locale support)
- **Recharts**: Financial charts for shift earnings visualization
- **p-limit/p-retry**: Rate limiting and retry logic for AI batch operations

### Payment Integration
- **Manual Pix**: Brazilian instant payment system (QR code/key display)
- Admin manually verifies payments and activates user accounts
- No automated payment gateway integration