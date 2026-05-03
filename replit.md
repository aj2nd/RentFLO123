# RentFLO - Fintech Operating System

## Overview

RentFLO is a rent-advance fintech platform that provides liquidity for landlords by advancing rent payments before tenant collection. The system manages the complete lifecycle of rent advances: paying property owners upfront, collecting from tenants via Razorpay, and tracking financial exposure through a ledger system. The application features role-based dashboards for Admins, Owners, and Tenants with a strict black-and-white minimalist design aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for success animations and transitions
- **Charts**: Recharts for admin dashboard visualizations
- **Design System**: High-contrast black (#000000) and white (#FFFFFF) theme with Inter font family, sharp corners (0px border-radius), and 2px solid white borders for buttons

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints with Zod validation for request/response schemas
- **Build**: esbuild for server bundling, Vite for client bundling
- **Static Serving**: Express static middleware serves built client assets in production

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for shared type definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Core Domain Models
- **Properties**: Links owners (landlords) to tenants with monthly rent and payout day configuration
- **Ledgers**: Tracks monthly rent cycles with `amountAdvanced` (paid to owner), `amountCollected` (from tenant), and status (`ARREARS`, `SETTLED`, `EXPOSED`)
- **Payments**: Multi-installment payment tracking with Razorpay integration
- **Maintenance Tickets**: Property maintenance request system with photo uploads

### Authentication & Security
- **Provider**: Replit Auth via OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user upsert on authentication with profile sync
- **User Roles**: Role field (TENANT/OWNER/ADMIN) determines dashboard access and permissions
- **API Protection**: All `/api/*` routes require `isAuthenticated` middleware (except Razorpay webhook which uses HMAC signature verification)
- **Admin Authorization**: Admin-only routes additionally require `requireRole('ADMIN')` middleware
- **Security Headers**: Helmet middleware provides X-Content-Type-Options, X-Frame-Options, HSTS, X-XSS-Protection
- **XSS Sanitization**: Global `sanitizeBody` middleware strips HTML from all text inputs in request bodies via `xss` library
- **PWA**: Splash screen with RENTFLO logo, icons at 192x192/512x512/maskable with cache-busted asset versions
- **Mobile UX**: Safe-area-insets, 44px min touch targets, tap-highlight disabled, user-select:none on interactive elements

### Recent Changes (May 2026)
- **Push Notifications**: Full Web Push API implementation
  - `pushSubscriptions` and `notifications` tables added to schema
  - `server/push.ts`: VAPID key auto-generation on first run, `sendPushToUser()` and `createNotification()` helpers
  - Service worker at `client/public/sw.js` handles push events and notification clicks
  - Registered in `client/src/main.tsx` on page load
  - `usePushNotifications` hook manages subscribe/unsubscribe lifecycle
  - `NotificationBell` component in sidebar: unread badge, dropdown panel, push on/off toggle, mark-all-read
  - Push triggers wired to: rent advanced (→ owner), payment received via Razorpay webhook (→ tenant + owner), maintenance ticket created (→ admins), maintenance ticket resolved (→ tenant)
  - API routes: `/api/push/vapid-key`, `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/notifications`, `/api/notifications/read`
- **Sidebar fully collapsible**: width=0 when collapsed, floating `>` tab always visible on left edge, main content gets full width

### Recent Changes (Apr 2026)
- **Property Setup Flow**: New `/setup` page appears right after role selection on `/onboarding`
  - **Owner Setup**: Form collects property address, monthly rent, payout day, and optional tenant email → creates property + auto-creates ledger for current month → redirects to owner dashboard
  - **Tenant Setup**: Search by landlord email, join a vacant property → redirects to tenant dashboard
  - Skip button available on both flows
- **Auto-Ledger Creation**: `POST /api/properties` now auto-creates a ledger for the current month so dashboards immediately show data
- **`/api/properties/mine`**: New endpoint returns only the logged-in user's properties (owner sees their own, tenant sees theirs)
- **Theme**: Full tiffany blue (#6FFFE9) and black redesign applied globally
- **New Logo**: Updated to new RentFLO brand logo (house with tiffany orbit ring)

### Recent Changes (Feb 2026)
- Added role-based routing: Users are automatically redirected to their role-specific dashboard
- **Onboarding Flow**: New users without roles see `/onboarding` with "I AM A LANDLORD" and "I AM A TENANT" role selection buttons
- **Tenant Dashboard**: 
  - Flexible Payment toggle (Full Only vs Custom amount)
  - Report Issue form with photo uploads
  - "Join My Home" section: Search properties by landlord email, join vacant properties
  - Recent Activity section showing split payment history
- **Owner Dashboard**: 
  - "RENT CREDITED" displayed in large serif font (Playfair Display) for recent payouts
  - Property Health widget with open/resolved ticket counts
  - "Add New Property" modal with address, rent, payout day, and optional tenant email
  - Recent Activity section showing ledger entries (Rent Advanced/Pending Advance)
- **Admin Dashboard**: 
  - Total Exposure tracker prominently displays financial exposure (Advanced - Collected)
  - Master Property List showing all properties with Occupied/Vacant status badges
- **Institutional-Grade Upgrades (Feb 2026)**:
  - Typography: Global Inter font for UI, Playfair Display for headlines/currency (.font-display, .currency-display)
  - Zero-Radius Constraint: Global 0px border-radius enforced via CSS
  - Master Ledger: Unified transaction view at `/ledger` with Date, Transaction ID, Action badges, running Balance
  - Legal Compliance: Terms of Service, Privacy Policy, Cancellation/Refund Policy pages
  - LegalFooter component on all pages with links to legal pages and support email
  - PWA Readiness: manifest.json with black theme (#000000) and icon placeholders
  - Tenant Auto-Match: `pendingTenantEmail` field on properties enables automatic tenant binding at registration
- **Product Improvements (May 2026)**:
  - T01 Payment Receipts: `ReceiptModal.tsx` — tiffany-themed modal with Razorpay payment ID after success
  - T02 CSV Export: Ledger header "Export CSV" button via `downloadCSV()` utility
  - T03 Rent Due Reminders: `POST /api/notifications/rent-due-check` creates in-app notification when rent is due
  - T04 Onboarding Checklist: 4-step progress card in TenantDashboard (Join → KYC → Agreement → First payment), auto-hides when complete
  - T05 Owner Analytics: BarChart (Recharts) with monthly collection history, total advanced/collected stats, on-time rate %
  - T06 Maintenance Status Notifications: Existing webhook at `PUT /api/maintenance/:id` fires notifications on status change
  - T07 UPI Deep Links: GPay / PhonePe / Any UPI buttons on TenantDashboard payments tab
  - T08 Agreement PDF Download: Download button on signed agreement state
  - T09 Profile Page: `/profile` — edit first/last name, view email/role/KYC status; `PATCH /api/auth/profile`
  - T10 Notification Center: `/notifications` — full notification inbox with mark-all-read; `GET /api/notifications/unread-count`; Bell icon in BottomNav with unread badge
  - T11 Skeleton Loaders: Context-aware shimmer skeletons replace spinners on TenantDashboard, OwnerDashboard, and Ledger pages

### API Endpoints
- **POST /api/auth/set-role**: Set user role (TENANT/OWNER/ADMIN)
- **GET /api/auth/user-by-email**: Lookup user by email address
- **GET /api/properties/by-owner-email**: Get properties by owner's email
- **POST /api/properties/:id/join**: Tenant joins a vacant property

### Key Workflows
1. **Manual Payout (Admin)**: Admin marks owner as paid, uploads proof of transfer screenshot, updates ledger `amountAdvanced`
2. **Tenant Collection**: Razorpay webhook updates `amountCollected`; when collected >= advanced, status becomes `SETTLED`
3. **Exposure Tracking**: When owner is paid but tenant hasn't paid, status is `EXPOSED`

## External Dependencies

### Payment Processing
- **Razorpay**: Payment gateway for tenant rent collection (lazy-initialized from `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables)

### Database
- **PostgreSQL**: Primary data store (connection via `DATABASE_URL` environment variable)

### Authentication
- **Replit OpenID Connect**: OAuth provider for user authentication (uses `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET` environment variables)

### Third-Party Libraries
- **drizzle-orm**: Type-safe SQL ORM with PostgreSQL dialect
- **drizzle-zod**: Automatic Zod schema generation from Drizzle tables
- **passport**: Authentication middleware with OpenID Client strategy
- **express-session**: Session management with PostgreSQL store

### Development Tools
- **@replit/vite-plugin-runtime-error-modal**: Error overlay for development
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling