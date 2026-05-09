# Tropely — Mood-Based Book Tracker

## Overview

Ported from Lovable (originally Supabase-backed) into the Replit pnpm monorepo stack. Tropely is a mood-based book tracker where readers tag reading sessions by emotional tone instead of stars.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind v3 + shadcn/ui + Zustand + @tanstack/react-query
- **Auth**: Clerk (ClerkProvider in App.tsx, `@clerk/express` on API server)
- **API framework**: Express (artifact: `artifacts/api-server`, port from `PORT` env)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Build**: esbuild

## Artifacts

| Artifact | Preview Path | Port |
|---|---|---|
| `artifacts/feltly` | `/` | `PORT` env |
| `artifacts/api-server` | `/api` | `PORT` env (8080 in dev) |
| `artifacts/tropely-mobile` | Expo Go (QR) | `PORT` env |

### Mobile (Expo) key facts
- EAS project ID: `c1cf53d3-29fc-4d08-9d0a-b6ad79f1fadd`
- Bundle ID / Android package: `com.nevora.tropely`
- Auth: `@clerk/clerk-expo` + `expo-secure-store` token cache
- Store: Zustand + AsyncStorage persist (`lib/store.ts`)
- API: `lib/api.ts` (Open Library search + companion chat); `setBaseUrl` from `@workspace/api-client-react` wired in `_layout.tsx`
- Screens: Home / Discover / Journal / Insights / Profile + Book Detail + Companion Chat
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set in `artifacts/tropely-mobile/.env`
- Web iframe preview shows Clerk domain error (expected for dev instances); use Expo Go QR on a real device

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

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/feltly run dev` — run frontend
- `pnpm --filter @workspace/tropely-mobile run dev` — run Expo dev server (scan QR with Expo Go)

## Mobile App Structure (Tabs)

| Tab | File | Description |
|---|---|---|
| Home | `app/(tabs)/index.tsx` | Daily readout, mood TBR, current reads |
| Library | `app/(tabs)/library.tsx` | **NEW** — premium bookshelf with spine view + theme picker |
| Discover | `app/(tabs)/discover.tsx` | Search + add books |
| Journal | `app/(tabs)/journal.tsx` | Reading journal entries |
| Insights | `app/(tabs)/insights.tsx` | Stats and charts |
| Profile | `app/(tabs)/profile.tsx` | Photo upload, achievement badges, goals |

**Routes (modal):** `/book/[id]`, `/companion/[bookKey]`, `/buddy-reads`

## Recent Features Added

- **Trope tagging on Discover add flow**: After adding a book from Discover, a 10-second floating banner offers 2–3 AI-suggested tropes to tag. Chips are selectable; saved via `updateBook`.
- **Shelf sorting**: Sort controls (Recent / A→Z / Pages / Rating) appear above any non-Want shelf grid. Rating sort only available on Finished shelf and reads from `reflections`. Want-to-read retains priority sort.
- **Home page daily readout** (`DailyReadout.tsx`): Shows today's pages and minutes vs goals with dual progress bars. Only renders if any reading sessions exist today.
- **Companion trope-aware prompts**: `tropes` array from the current book is now sent in the `/api/companion/chat` POST body so the AI can reference tropes in its responses.
- **Mood-based TBR picker** (`MoodTbrPicker.tsx`): Section above Shelves on home. Shows mood chips filtered to moods that have TBR books. Selecting a mood reveals matching books; clicking one moves it to Reading and navigates home.
- **Reading pace goal (minutes)**: `dailyGoalMinutes` (default 30) added to store. `DailyReadout` tracks both pages and minutes. Profile > Daily reading goal section adds a minutes/day row with quick-pick buttons (15 / 30 / 60).
- **Star ratings on shelf cards**: Finished shelf book cards now show up to 5 amber stars sourced from the book's `Reflection.rating` (1–5). Only shown when a reflection exists.

## Notes

- All Supabase calls fully removed from the frontend; `integrations/supabase/client.ts` is a stub that returns empty objects.
- BuddyReads uses 5-second polling instead of Supabase Realtime.
- OCR highlight and daily-digest (push) features show graceful "not available" toasts.
- Mood-tag-books uses deterministic hashing as fallback (no AI in this version).
- Debounced localStorage persistence is already wired in `store.ts` (`debouncedStorage` at persist config line 676).
- All 6 "next features" from the session plan (Premium page, push SW, cold-start social feed, debounced persistence, richer Book Detail, data restore) were already fully implemented in the codebase before this session.
