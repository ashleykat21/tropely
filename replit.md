# Tropely — Mood-Based Book Tracker (Mobile)

## Overview

Tropely is a mood-based book tracker where readers tag reading sessions by emotional tone. This is a React Native / Expo mobile app that connects to the production Railway backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo + React Native (expo-router, Clerk auth, Zustand + AsyncStorage)
- **Auth**: @clerk/clerk-expo + expo-secure-store
- **Backend**: Railway (tropely-production.up.railway.app) — external production API
- **Fonts**: Fraunces (serif headings) + DM Sans (body)

## Artifacts

| Artifact | Kind | Preview Path |
|---|---|---|
| `artifacts/tropely-mobile` | Expo / mobile | `/mobile/` |

## Environment Variables (artifacts/tropely-mobile/.env)

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `EXPO_PUBLIC_DOMAIN` — Railway API domain (`tropely-production.up.railway.app`)

## API

All API calls go to `https://tropely-production.up.railway.app` (Railway production). The `lib/api.ts` helper reads `EXPO_PUBLIC_DOMAIN` and prefixes all requests.

## Key Commands

- `pnpm --filter @workspace/tropely-mobile run dev` — start Expo dev server (scan QR with Expo Go)
- `pnpm --filter @workspace/tropely-mobile run android` — run on Android
- `pnpm --filter @workspace/tropely-mobile run ios` — run on iOS

## EAS / Expo

- EAS Project ID: `c1cf53d3-29fc-4d08-9d0a-b6ad79f1fadd`
- Bundle ID: `com.nevora.tropely`
- Slug: `tropely-zlejqlsxgwsnwpfwrwir`

## Design System

- **Typography**: Fraunces (serif, display/headings) + DM Sans (body)
- **Palette**: dark editorial — background `#0E0D14`, with mood-reactive accent colors
- **Mood colors**: dynamic HSL custom properties per emotional tone

## GitHub

- Repo: `https://github.com/ashleykat21/feltly` (private)
- PAT stored in `GITHUB_PAT` secret
