# Mecenate — Test Assignment

React Native + Expo mobile app for the Mecenate content platform.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81 + Expo SDK 54 (Expo Router v6) |
| Language | TypeScript (strict) |
| Server state | TanStack React Query v5 — infinite scroll, optimistic updates, cache seeding |
| Real-time state | MobX 6 — WebSocket events, live likes/comments |
| Animations | React Native Reanimated v4 — spring cards, sliding tab pill, skeleton shimmer, number ticker |
| Haptics | Expo Haptics — tactile feedback on like/unlike |
| HTTP | Axios — interceptors for auth + error normalisation |
| Storage | AsyncStorage — UUID token persistence |
| Navigation | Expo Router (file-based, Stack) |

---

## Features

### Feed Screen
- Infinite scroll with cursor-based pagination (10 posts/page)
- Tab filter: **Все / Бесплатные / Платные** — animated sliding pill indicator
- Pull-to-refresh
- Skeleton loading placeholders with synchronised shimmer (Reanimated)
- Live WebSocket status dot in header — pulsing green when connected, smooth colour transition on state change
- Real-time like/comment count updates from WebSocket on feed cards
- Spring scale animation on card press (Reanimated + Pressable)

### Post Detail Screen
- Instant render from feed cache — no skeleton if post was already visible in feed
- Full post content with cover image, author info, verified badge, subscriber count
- Tier badge (free / paid) with paywall UI for locked content
- **Like button** — spring bounce animation, haptic feedback, directional number ticker (slides up on increment, down on decrement)
- Optimistic like updates with server reconciliation and rollback on error
- Comments list with lazy load (20/page, infinite scroll)
- **Optimistic comment submit** — comment appears immediately at 60% opacity, replaced in-place with server response (no flash/refetch)
- New real-time comments (WebSocket) appear at top with `FadeInDown` animation
- Comment input with 500-char limit, character counter, send button spring animation, keyboard-aware layout

### Real-time (WebSocket)
- Auto-reconnect with **exponential backoff** (2s → 4s → 8s → 16s → 30s, max 10 attempts)
- Reconnects when app returns to foreground (AppState listener)
- `like_updated` → patches MobX store + React Query single-post cache + all active feed page caches
- `comment_added` → prepends to MobX live comments, bumps count in all caches

### App-wide
- Branded splash screen with animated wordmark and pulsing dot (Reanimated)
- Offline detection banner — slides in from top when connectivity is lost, disappears on recovery
- Dark theme throughout — `userInterfaceStyle: dark`, splash background matches app background (no white flash)
- Avatar images fade in on load (Reanimated opacity transition), initials shown as fallback

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

The defaults point to the live test server — the app works out of the box without any changes.

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) installed on your iOS or Android device

### Install & Run

```bash
cd mecenate
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your device.

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
│   ├── _layout.tsx          # Root layout: QueryClient, auth init, WS connect,
│   │                        #   branded splash, offline banner
│   ├── index.tsx            # Feed screen
│   ├── post/[id].tsx        # Post detail screen
│   └── +not-found.tsx       # 404 fallback
├── src/
│   ├── api/
│   │   ├── client.ts        # Axios instance with auth + error interceptors
│   │   └── posts.ts         # React Query hooks: usePosts, usePost (feed-seeded),
│   │                        #   useLikePost, useComments, useAddComment (optimistic)
│   ├── stores/
│   │   ├── authStore.ts     # MobX: UUID token (generated once, persisted)
│   │   ├── postStore.ts     # MobX: real-time likes/comments from WebSocket
│   │   └── wsStatusStore.ts # MobX: WebSocket connection status
│   ├── ws/
│   │   └── wsService.ts     # WebSocket client: connect, exponential backoff,
│   │                        #   event dispatch to MobX + React Query caches
│   ├── components/
│   │   ├── Avatar.tsx       # Avatar with initials fallback + fade-in on load
│   │   ├── TierBadge.tsx    # Free / Paid badge
│   │   ├── PostCard.tsx     # Feed card — MobX observer, spring press animation
│   │   ├── LikeButton.tsx   # Spring + haptics + directional number ticker
│   │   ├── CommentItem.tsx  # Comment row — FadeInDown for new/optimistic items
│   │   ├── CommentInput.tsx # Text input with char limit + send button animation
│   │   ├── TabFilter.tsx    # Sliding pill tab bar (Reanimated)
│   │   ├── LiveDot.tsx      # WS status dot — interpolated colour + pulse
│   │   ├── SkeletonCard.tsx # Synchronised shimmer skeleton (feed + detail)
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
- **React Query** owns all server-fetched data (posts, comments). Handles caching, deduplication, background refetching, and pagination.
- **MobX** owns real-time overlay state — live like counts and new comments arriving via WebSocket. Components observe both layers and merge them.
- **Optimistic updates** on like and comment: UI updates immediately, API fires in background, server response reconciles in-place. Rollback on error.

### Feed → Detail Cache Seeding
`usePost` checks all active feed query caches before making a network request. If the post was already loaded in the feed, the detail screen renders instantly with that data while a background fetch runs for the full post body.

### WebSocket → Cache Sync
When a `like_updated` or `comment_added` event arrives, `wsService` updates:
1. The MobX `postStore` (detail screen real-time state)
2. The React Query single-post cache `['post', id]`
3. All active infinite feed query caches `['posts', *]` — iterating pages to patch the matching post in-place

Feed cards reflect live counts without requiring navigation to the detail screen.

### Optimistic Comment Flow
1. `onMutate`: snapshot caches, prepend optimistic comment, bump count
2. Comment appears immediately at 60% opacity with `FadeInDown`
3. `onSuccess`: replace optimistic entry in-place with real server comment — no invalidation, no flash
4. `onError`: restore both snapshots

---

## Commit History

See `git log --oneline` for incremental progress — each step committed separately.
