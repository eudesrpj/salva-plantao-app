# GitHub Copilot Instructions - Salva Plantão

## Project Overview

**Salva Plantão** is a comprehensive medical shift management and clinical documentation platform designed for healthcare professionals in Brazil. The application helps doctors manage their shifts, create medical prescriptions, track patient care, handle financial records, and access clinical tools and protocols.

### Technology Stack

- **Frontend**: React 18.3 + TypeScript 5.6 + Wouter (routing) + Vite 7.3
- **Backend**: Express 4.21 + Node.js (ESM)
- **Database**: PostgreSQL with Drizzle ORM 0.39
- **UI Framework**: Tailwind CSS 3.4 + Radix UI + shadcn/ui components
- **State Management**: Zustand 5.0 + TanStack Query 5.60
- **Authentication**: Passport.js with local strategy + OpenID Client
- **AI Integration**: OpenAI 6.15 for AI features
- **Build Tools**: esbuild 0.25 + tsx 4.20 + cross-env

### Architecture

- **Monorepo structure** with three main folders:
  - `/client` - React frontend application
  - `/server` - Express backend API
  - `/shared` - Shared types, schemas, and models
- **Path aliases**: 
  - `@/*` → `./client/src/*`
  - `@shared/*` → `./shared/*`
- **ESM-only**: All code uses ES modules (`type: "module"`)
- **Copyright notice**: All source files include copyright header for Salva Plantão

## Coding Guidelines

### General Principles

- **Write clean, maintainable TypeScript code** with proper type safety
- **Follow existing patterns** in the codebase - consistency is key
- **Keep changes minimal** - avoid unnecessary refactoring
- **Use existing components and utilities** before creating new ones
- **Maintain backward compatibility** - never break existing functionality

### TypeScript Standards

- **Strict mode enabled** - all TypeScript strict checks are on
- Use **explicit types** for function parameters and return values
- Prefer **type inference** for variable declarations when clear
- Use **Zod schemas** for runtime validation (with `drizzle-zod`)
- Create **insert schemas** with `createInsertSchema` for database operations
- Export types using `typeof table.$inferSelect` and `z.infer<typeof schema>`
- Always import types with `import type` when only used as types

### Code Style

- Use **double quotes** for strings (follows existing pattern)
- Use **semicolons** at end of statements
- Use **const** by default, `let` only when reassignment is needed
- Use **async/await** instead of Promise chains
- Use **arrow functions** for callbacks and inline functions
- Use **template literals** for string interpolation
- Keep functions **small and focused** (single responsibility)
- Prefer **early returns** to reduce nesting

### React Patterns

- Use **functional components** with hooks exclusively
- Use **React Query** (`@tanstack/react-query`) for server state
- Use **Zustand** for client-side global state
- Import UI components from `@/components/ui/*` (shadcn/ui)
- Use **Wouter** for routing (`useRoute`, `useLocation`, `Link`, `Redirect`)
- Prefer **composition** over prop drilling (use contexts when needed)
- Use **custom hooks** in `/client/src/hooks` for reusable logic
- Follow existing component structure in `/client/src/components`

### Backend Patterns

- Use **Express router pattern** for routes organization
- Implement routes in `/server/routes` directory
- Register routes in `/server/routes.ts`
- Use **authenticate middleware** for protected routes
- Use **storage layer** (`/server/storage.ts`) for database operations
- Never write raw SQL - use **Drizzle ORM** exclusively
- Use **withDbTimeout** wrapper for database operations with timeouts
- Implement proper **error handling** with try-catch blocks
- Return appropriate **HTTP status codes** (200, 201, 400, 401, 403, 404, 500)

### Database & Schema

- Define schemas in `/shared/schema.ts` using Drizzle
- Use **snake_case** for column names in database
- Use **camelCase** for TypeScript properties (Drizzle auto-converts)
- Always include `createdAt` and `updatedAt` timestamps for new tables
- Create **Zod validation schemas** with `createInsertSchema`
- Use **migrations** via `drizzle-kit push` (run `npm run db:push`)
- Never modify existing tables without considering backward compatibility

### Security Requirements

- **Always validate user input** using Zod schemas
- **Verify user ownership** before allowing operations on user data
- Check `req.user?.id` or `req.userId` for authenticated operations
- Verify **admin role** with `req.user?.claims?.role === 'admin'` for admin routes
- **Never expose sensitive data** in API responses (passwords, tokens, etc.)
- Use **environment variables** for secrets (stored in `.env`, never committed)
- All cookies must use `httpOnly`, `secure` (in production), and `sameSite: 'strict'`
- **Sanitize user input** before database operations
- Use **prepared statements** (Drizzle ORM handles this)
- Implement **proper error messages** that don't leak sensitive information

### File Organization

- **Backend routes**: `/server/routes/`
- **Backend services**: `/server/services/`
- **Backend utilities**: `/server/utils/`
- **Frontend pages**: `/client/src/pages/`
- **Frontend components**: `/client/src/components/`
- **Frontend hooks**: `/client/src/hooks/`
- **Frontend stores**: `/client/src/stores/`
- **Shared schemas**: `/shared/schema.ts` and `/shared/models/`
- **Shared routes**: `/shared/routes.ts` (API route definitions)

### API Design

- Use **RESTful conventions** for API endpoints
- Base API path: `/api/`
- Use proper HTTP methods: GET, POST, PUT, DELETE
- Return **consistent response format**:
  ```typescript
  // Success
  res.json({ data, message?: string })
  
  // Error
  res.status(4xx|5xx).json({ error: string, details?: any })
  ```
- Implement **pagination** for list endpoints (page, perPage)
- Use **query parameters** for filtering and sorting
- Version APIs if breaking changes are needed (`/api/v2/...`)

### Testing

- Currently **no automated test suite** exists - manual testing only
- Test changes manually using:
  - `npm run dev` - Development server
  - `npm run build` - Production build
  - `npm run check` - TypeScript type checking
- Verify both **frontend and backend** functionality
- Test on both **desktop and mobile** viewports
- Test **authentication flows** and permission checks

## Domain-Specific Guidelines

### Medical Content

- This is a **medical application** - accuracy is critical
- Use correct **medical terminology** in Portuguese (Brazil)
- Default medication dosages must be **clinically appropriate**
- Respect **age groups** (adulto, pediatrico) in prescriptions
- Include **safety warnings** (renal adjustment, pregnancy warnings)
- Format medical data consistently (e.g., "500mg", "6/6h")

### Brazilian Context

- All user-facing text should be in **Portuguese (Brazil)**
- Use **Brazilian Real (R$)** for currency formatting
- Follow **Brazilian date formats** (DD/MM/YYYY)
- Consider **Brazilian medical regulations** and practices
- IRPF calculations use **Brazilian tax tables**

### Medications Management

- **Admin medications** (`medications` table) - global catalog, never modified by users
- **User medications** (`user_medications` table) - user-specific custom medications
- Always verify **userId** when operating on user medications
- Normalize medication names for searching: lowercase, no accents, trimmed
- Support **multiple routes of administration** (VO, IV, IM, SC, etc.)

### User Roles

- **Regular users** - doctors using the platform
- **Admin users** - have access to admin panel and system configuration
- Check role with: `req.user?.claims?.role === 'admin'`
- Admins can access `/admin` route and admin API endpoints

## Common Patterns

### Adding a New API Endpoint

1. Define schema in `/shared/schema.ts` if needed
2. Add validation with Zod
3. Create route file in `/server/routes/` (or add to existing)
4. Implement route handler with authentication
5. Add storage method in `/server/storage.ts`
6. Register route in `/server/routes.ts`
7. Add route definition to `/shared/routes.ts` for type safety
8. Test manually with curl or frontend

### Adding a New Page

1. Create component in `/client/src/pages/YourPage.tsx`
2. Add route in `/client/src/App.tsx`
3. Add navigation link if needed (Sidebar or BottomNav)
4. Use existing UI components from `@/components/ui/`
5. Implement data fetching with React Query
6. Handle loading and error states

### Adding a New Database Table

1. Define table schema in `/shared/schema.ts`
2. Create insert schema with `createInsertSchema`
3. Export types with `$inferSelect` and `z.infer`
4. Add CRUD methods to `/server/storage.ts`
5. Run `npm run db:push` to apply schema changes
6. Create API routes for the new table
7. Test database operations

## Copyright and Attribution

Every new source file (TypeScript, JavaScript) must include this header:

```typescript
/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/
```

## Environment and Deployment

- **Development**: `npm run dev` (runs on http://localhost:5000)
- **Production**: `npm run build && npm start`
- **Database**: PostgreSQL (connection via DATABASE_URL env var)
- **Deployment**: Render.com (see render.yaml for configuration)
- **Environment variables**: Define in `.env` (never commit this file)

## External Services

- **OpenAI API**: Used for AI features (chat, interconsult, assistant)
- **WebSocket**: Real-time features via ws library
- **Sessions**: PostgreSQL session store via connect-pg-simple
- **Authentication**: Passport.js with session-based auth

## Performance Considerations

- Use **memoization** for expensive computations (memoizee library available)
- Implement **pagination** for large datasets
- Use **React Query caching** effectively (staleTime, cacheTime)
- Optimize **database queries** (use proper indexes)
- Use **database timeouts** (withDbTimeout wrapper)
- Minimize **bundle size** (dynamic imports for large components if needed)

## Accessibility

- Use **semantic HTML** elements
- Radix UI components are **accessible by default**
- Include **aria-labels** for icon-only buttons
- Ensure **keyboard navigation** works
- Use proper **heading hierarchy** (h1, h2, h3...)

## Documentation

- Document **complex logic** with inline comments
- Add **JSDoc comments** for utility functions
- Update **README files** if adding major features
- Keep **API documentation** in sync with code

## Common Pitfalls to Avoid

- ❌ Don't modify the global medications catalog
- ❌ Don't break backward compatibility without careful consideration
- ❌ Don't skip user ownership verification on user-specific data
- ❌ Don't use raw SQL queries (use Drizzle ORM)
- ❌ Don't commit .env files or secrets
- ❌ Don't remove or disable existing features without explicit requirement
- ❌ Don't create duplicate functionality that already exists
- ❌ Don't ignore TypeScript errors (npm run check should pass)
- ❌ Don't use CJS (require/module.exports) - use ESM only
- ❌ Don't modify package.json without good reason

## When in Doubt

- **Check existing code** for similar patterns
- **Follow the existing style** consistently
- **Keep changes minimal** and focused
- **Ask for clarification** rather than guessing
- **Test thoroughly** before considering complete
- **Verify type safety** with `npm run check`

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintainer**: Salva Plantão Development Team
