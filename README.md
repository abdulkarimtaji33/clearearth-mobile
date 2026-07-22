# ClearEarth Driver

A standalone React Native (Expo) app for the ClearEarth ERP **driver** role — view assigned
pickups, start them, and confirm completion with quantity/condition/photos. Built to be a
genuinely polished, native-feeling companion to the desktop ERP, not a reskin of it.

## Stack

- **Expo** (managed workflow) + **TypeScript**, targeting iOS and Android
- **NativeWind v4** (Tailwind for RN) for styling, with a hand-built design system — see
  `src/theme/tokens.ts` and `src/components/ui/`
- **React Navigation** (native-stack) for the Auth ↔ App flow
- **TanStack Query** for all server state (fetching, caching, mutations)
- **axios** with a bearer-token interceptor and single-flight silent token refresh
- **expo-secure-store** for token persistence
- **expo-image-picker** + **react-native-image-viewing** for the pickup-completion photo flow
- **react-native-reanimated** for motion (press feedback, layout transitions, the stepper)

## Project structure

```
src/
  navigation/     React Navigation stacks (Auth, App) + RootNavigator
  screens/        auth/LoginScreen, pickups/{PickupListScreen,PickupDetailScreen}
  components/
    ui/           Design-system primitives (Button, Card, Badge, Input, Skeleton, ...)
    pickups/      Feature components (SummaryTiles, PickupCard, CompletePickupForm, ...)
  api/            Typed axios client + per-resource request functions + React Query setup
  hooks/          AuthContext + React Query hooks (usePickups, useStartPickup, ...)
  lib/            secureStore, env (API URL resolution), format, linking (maps/phone)
  theme/          Design tokens (colors, spacing, radii) — mirrored into tailwind.config.js
  constants/      statusConfig.ts — single source of truth for priority labels/colors
```

## Getting started

1. `npm install`
2. Make sure the ClearEarth backend is running and reachable from your phone (same Wi-Fi as
   your dev machine): `cd ../clearearth-backend && npm run dev`
3. `npx expo start` — scan the QR code with Expo Go (iOS/Android), or press `a`/`i` for an
   emulator/simulator.
4. Sign in with a `driver`-role account from the backend's DB. Accounts with any other role are
   rejected by design — this app is driver-only.

### Pointing the app at your backend

The app guesses your dev machine's LAN IP automatically from the Metro connection, which works
for most `expo start` setups without any configuration. If it doesn't:

- Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` explicitly, **or**
- In dev builds only, tap **"Connection settings"** on the login screen to override the API URL
  at runtime (persisted on-device, no rebuild needed) — handy when multiple people are testing
  against different machines.

## Scripts

- `npx expo start` — dev server
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint
- `eas build --profile preview --platform android` — internal-distribution build (requires an
  Expo/EAS account; `eas.json` has `development`/`preview`/`production` profiles scaffolded)

## Backend contract

This app consumes the existing ClearEarth backend `/driver/*` endpoints unchanged — see
`src/api/types.ts` for the exact shapes and `clearearth-backend/src/controllers/driver.controller.js`
for the source of truth. Notably:

- `pickup_location` is a free-text/URL field, not coordinates — there's no lat/lng anywhere in
  this API, so the location card opens the device's maps app via a search query rather than an
  embedded map.
- The `complete` endpoint expects the photo field name to be exactly `photos` (multipart), and
  appends new photos rather than replacing existing ones.
- `GET/POST /driver/pickups*` require role `driver` (also reachable by admin/tenant_admin/
  operations_manager server-side, but this app's UX assumes a driver account).

## Known limitations / follow-ups (not in scope for v1)

- **Online-only** — no offline queueing of start/complete actions. A meaningful feature on its
  own; scope it separately if needed.
- **No push notifications** — drivers see new assignments by opening the app (pull-to-refresh or
  on-focus refetch), not via push. The backend has no push infrastructure for this today.
- **No crash reporting wired in** — `sentry-expo` (or similar) can be added to `App.tsx`'s
  `ErrorBoundary` if desired.
- **App icon/splash are placeholders** — replace `assets/icon.png`, `assets/splash*.png`, and
  the Android adaptive-icon layers with final branded assets before a public release.
