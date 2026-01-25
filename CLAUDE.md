# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

nConnect Registration System - A full-stack web application for managing conference registrations for nConnect26, an IT conference in Nitra, Slovakia (March 26, 2026). The UI is in Slovak, code is in English.

**GitHub:** https://github.com/CrawlySon/nconnect-registration

## Tech Stack

- **Framework:** Next.js 14 (App Router) with React 18
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS 3.4 with custom nConnect brand colors (glassmorphism design)
- **Database:** Supabase (PostgreSQL with Row-Level Security)
- **Email:** Resend for transactional emails (requires RESEND_API_KEY)
- **Charts:** Recharts (for analytics)
- **Fonts:** Space Grotesk (headings), Inter (body)

## Common Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run Next.js linter
```

## Project Structure

```
/src
├── /app                    # Next.js App Router pages
│   ├── /api               # REST API endpoints
│   │   ├── /register      # User registration
│   │   ├── /login         # Attendee login
│   │   ├── /sessions      # Session data (GET with ?attendee=ID)
│   │   ├── /registrations # Session registration (POST/DELETE, /bulk)
│   │   ├── /debug         # Debug endpoints (e.g., /debug/registrations?email=xxx)
│   │   └── /admin         # Admin-only endpoints (auth, sessions, export, stats)
│   ├── /admin             # Admin dashboard pages
│   │   ├── /dashboard     # Statistics dashboard
│   │   ├── /sessions      # Session CRUD (/new, /[id], /bulk-edit)
│   │   ├── /attendees     # Attendee list
│   │   ├── /analytics     # Registration charts (Recharts)
│   │   ├── /email-test    # Email testing
│   │   └── /live-demo     # Live timeline testing
│   ├── /live              # Live timeline for conference day
│   ├── /login             # Attendee login page
│   └── /sessions          # Session selection page
├── /lib
│   ├── /supabase          # Database clients (server.ts, client.ts)
│   ├── email.ts           # Email templates and sending
│   └── utils.ts           # Business logic utilities
└── /types
    └── index.ts           # All TypeScript type definitions
/database
└── schema.sql             # Supabase schema with seed data
```

## Key Architecture Patterns

- **Server/Client Components:** Uses Next.js 13+ patterns with `'use client'` directive where needed
- **API Routes:** RESTful endpoints in `/app/api/` using Next.js route handlers
- **Database Access:** Server-side uses service role key, client-side uses anon key
- **Path Aliases:** `@/*` maps to `./src/*` (configured in tsconfig.json)

## Database Tables

- `stages` - Conference stages/rooms (2 default: AI & Data, Soft Dev)
- `sessions` - Individual talks with speaker, time, capacity
- `attendees` - Registered participants (email unique)
- `registrations` - Many-to-many linking attendees to sessions

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Business Logic Notes

- Time conflict detection prevents double-booking same time slots
- Capacity is tracked per session with real-time availability
- Email notifications sent on: registration, session add/remove, updates
- Sessions grouped by time slots and stages in UI

## Testing

No test framework is currently configured. This is a known gap.

## Known Issues / Bugs

### BUG: "Prednáška nebola nájdená" pri ukladaní registrácií
**Status:** Active / Investigating
**Problem:** Po registrácii nového účastníka a výbere prednášok sa pri kliknutí na "Potvrdiť zmeny" zobrazí chyba "Prednáška nebola nájdená".

**Debug logs added:**
- `src/app/api/registrations/bulk/route.ts` - logging request data and session queries
- `src/app/api/sessions/route.ts` - logging session IDs returned

**Key files for debugging:**
- `src/app/api/registrations/bulk/route.ts:73-85` - where error occurs
- `src/app/sessions/page.tsx` - frontend sending sessionIds

### BUG: Registrations not showing in UI after login
**Status:** Active
**Problem:** When an attendee logs in, their previously registered sessions don't appear.

**Possible causes:**
1. Email case sensitivity issue
2. Foreign key issue in registrations table

## Implemented Features

- ✅ Attendee registration and login
- ✅ Session selection with conflict detection
- ✅ Admin panel (dashboard, sessions CRUD, attendees)
- ✅ Admin attendee management (view, delete attendee, add/remove from sessions)
- ✅ Bulk session editing (spreadsheet-like)
- ✅ Analytics with charts (Recharts)
- ✅ CSV export (attendees + registrations)
- ✅ Live timeline for conference day
- ✅ Admin demo mode (time simulation)
- ✅ Glassmorphism design
- ⚠️ Emails - templates ready, needs RESEND_API_KEY
- ❌ BUG: "Prednáška nebola nájdená" (see above)
- ❌ BUG: Registrations not showing in UI (see above)

## Styling Conventions

- Use Tailwind utility classes
- Glassmorphism design pattern (backdrop-blur, semi-transparent backgrounds)
- Custom components defined in `globals.css`: `.btn-primary`, `.input-field`, `.session-card`, `.capacity-bar`, `.toast`
- Brand colors available via Tailwind config: `primary`, `secondary`, `accent`, `highlight`, `surface`, `muted`
