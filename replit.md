# Feltly — Mood-Based Book Tracker (Web)

## Overview

Feltly is a mood-based book tracker where readers tag reading sessions by emotional tone instead of stars. Ported from Lovable into the Replit pnpm monorepo stack.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + Zustand + @tanstack/react-query
- **Auth**: Clerk (ClerkProvider in App.tsx, `@clerk/express` on API server)
- **API framework**: Express (artifact: `artifacts/api-server`, port from `PORT` env)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Build**: esbuild

## Artifacts

| Artifact | Preview Path | Port |
|---|---|---|
| `artifacts/feltly` | `/` | `PORT` env |
| `artifacts/api-server` | `/api` | `PORT` env (8080 in dev) |

## API Routes

All routes under `/api/*` — authenticated via Clerk session cookie.

- `GET/PATCH /api/profiles/me` — user profile
- `GET/POST /api/activity` — reading activity feed
- `GET/PUT /api/reading-positions` — sync page progress across devices
- `GET/POST/DELETE /api/companion/:bookKey/messages` — AI companion chat history
- `GET/POST /api/notifications` — notification bell
- `GET/POST /api/follows` — social follows
- `GET/POST /api/taste-profiles/me` — mood taste profile
- `GET/POST /api/buddy-reads` — buddy read rooms
- `POST /api/buddy-reads/:id/join` — join a room
- `PATCH /api/buddy-reads/:roomId/members/:memberId` — update page progress
- `GET/POST /api/buddy-reads/:id/messages` — room chat
- `POST /api/book-lookup` — ISBN → book metadata (Open Library)
- `POST /api/mood-tag-books` — deterministic mood tagging for book lists
- `POST /api/ocr-highlight` — returns 503 (OCR requires external AI service)
- `GET/POST /api/library-snapshot` — library sync snapshots
- `GET/POST /api/mood-recs` — mood-based book recommendations
- `GET/POST /api/push` — web push subscriptions

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/feltly run dev` — run frontend

## Design System

- **Typography**: Fraunces (serif, display/headings) + DM Sans (body)
- **Palette**: warm cream editorial — background `hsl(34 38% 91%)` (#F1E9DF), foreground `hsl(25 30% 12%)` (#2A1F14)
- **Mood colors**: dynamic HSL CSS custom properties (`--mood-h`, `--mood-s`, `--mood-l`)
- **Components**: shadcn/ui with Tailwind v4

## Notes

- Supabase removed; all data goes through the Express API + PostgreSQL.
- Mood-tag-books uses deterministic hashing as fallback (no AI).
- OCR highlight shows graceful "not available" toast.
- Push notifications use web-push library.
