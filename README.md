# Mecenate — Test Assignment

React Native + Expo mobile app for the Mecenate content platform.

## Screenshots

Feed screen with tab filter, infinite scroll, and real-time WebSocket status indicator. Post detail with animated like button, lazy-loaded comments, and live updates.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 (Expo Router v6) |
| Language | TypeScript (strict) |
| Server state | TanStack React Query v5 — infinite scroll, optimistic updates, caching |
| Real-time state | MobX 6 — WebSocket events, live likes/comments |
| Animations | React Native Reanimated v4 — spring like button, fade-in comments, skeleton shimmer |
| Haptics | Expo Haptics — tactile feedback on like/unlike |
| HTTP | Axios — interceptors for auth + error normalisation |
| Storage | AsyncStorage — UUID token persistence |
| Navigation | Expo Router (file-based, Stack) |

---

## Features

### Feed Screen
- Infinite scroll with cursor-based pagination (10 posts/page)
- Tab filter: **Все / Бесплатные / Платные**
- Pull-to-refresh
- Skeleton loading placeholders (Reanimated shimmer)
- Live WebSocket status dot in header (pulsing when connected)
- Real-time like/comment count updates from WebSocket

### Post Detail Screen
- Full post content with cover image
- Author info: avatar, display name, username, subscriber count, verified badge
- Tier badge (free / paid) with paywall UI for locked content
- **Like button** — spring animation (Reanimated), haptic feedback, animated number ticker
- Optimistic like updates with server reconciliation and rollback on error
- Comments list with lazy load (20/page, infinite scroll)
- New real-time comments appear at the top with `FadeInDown` animation
- Comment input with 500-char limit, character counter, keyboard-aware layout

### Real-time (WebSocket)
- Auto-reconnect with exponential backoff (max 10 attempts)
- Reconnects when app returns to foreground (AppState listener)
- `like_updated` → updates MobX store + React Query cache (both feed and detail)
- `comment_added` → prepends to MobX live comments, bumps count in cache

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://k8s.mectest.ru/test-app` | REST API base URL |
| `EXPO_PUBLIC_WS_URL` | `wss://k8s.mectest.ru/test-app/ws` | WebSocket URL |

The defaults point to the live test server, so the app works out of the box without any changes.

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) installed on your iOS or Android device

### Install & Run

```bash
cd mecenate

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** on your device.

### Platform-specific

```bash
# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

---

## Project Structure

```
mecenate/
├── app/
│   ├── _layout.tsx          # Root layout: QueryClient, auth init, WS connect
│   ├── index.tsx            # Feed screen
│   ├── post/[id].tsx        # Post detail screen
│   └── +not-found.tsx       # 404 fallback
├── src/
│   ├── api/
│   │   ├── client.ts        # Axios instance with auth + error interceptors
│   │   └── posts.ts         # React Query hooks: usePosts, usePost, useLikePost,
│   │                        #   useComments, useAddComment
│   ├── stores/
│   │   ├── authStore.ts     # MobX: UUID token (generated once, persisted)
│   │   ├── postStore.ts     # MobX: real-time likes/comments from WebSocket
│   │   └── wsStatusStore.ts # MobX: WebSocket connection status
│   ├── ws/
│   │   └── wsService.ts     # WebSocket client: connect, reconnect, event dispatch
│   ├── components/
│   │   ├── Avatar.tsx       # User avatar with initials fallback
│   │   ├── TierBadge.tsx    # Free / Paid badge
│   │   ├── PostCard.tsx     # Feed card (MobX observer for live counts)
│   │   ├── LikeButton.tsx   # Reanimated spring + haptics + number ticker
│   │   ├── CommentItem.tsx  # Comment row with FadeInDown for new items
│   │   ├── CommentInput.tsx # Text input with char limit + send animation
│   │   ├── TabFilter.tsx    # All / Free / Paid tab bar
│   │   ├── LiveDot.tsx      # WS status indicator (pulsing dot)
│   │   ├── SkeletonCard.tsx # Shimmer loading placeholder
│   │   └── ErrorView.tsx    # Error state with retry button
│   ├── theme/
│   │   └── tokens.ts        # Design tokens: colors, spacing, typography, radius
│   └── types/
│       └── api.ts           # TypeScript interfaces for all API models
└── assets/                  # App icons and splash screen
```

---

## Authentication

No registration required. On first launch a UUID v4 is generated and stored in AsyncStorage. It's used as:
- `Authorization: Bearer <uuid>` header on all REST requests
- `?token=<uuid>` query param on the WebSocket connection

Each UUID has its own like state on the server.

---

## Architecture Notes

### State Management Strategy
- **React Query** owns all server-fetched data (posts, comments). It handles caching, deduplication, background refetching, and pagination.
- **MobX** owns real-time overlay state — live like counts and new comments arriving via WebSocket. Components observe both layers and merge them.
- **Optimistic updates** on like: MobX is updated immediately, the API mutation fires in the background, and on success the server's authoritative count is applied. On error, the previous state is restored.

### WebSocket → Cache Sync
When a `like_updated` or `comment_added` event arrives, `wsService` updates:
1. The MobX `postStore` (for the open detail screen)
2. The React Query single-post cache `['post', id]`
3. All active infinite feed query caches `['posts', *]` — iterating pages to patch the matching post in-place

This ensures feed cards reflect live counts even without navigating to the detail screen.

---

## Commit History

Each feature step is committed separately. See `git log --oneline` for incremental progress.
