# Mecenate — Test Assignment

React Native + Expo mobile app for the Mecenate platform.

## Stack

- **React Native + Expo SDK 54** (Expo Router v6)
- **TypeScript**
- **MobX** — real-time state (WebSocket events)
- **React Query (TanStack Query v5)** — server state, infinite scroll, optimistic updates
- **React Native Reanimated v3** — like button animation
- **Expo Haptics** — haptic feedback on like
- **Axios** — HTTP client
- **AsyncStorage** — UUID token persistence

## Features

- Feed screen with infinite scroll and tab filter (All / Free / Paid)
- Post detail with full content, cover image, author info
- Like button with spring animation (Reanimated) + haptic feedback
- Optimistic like updates
- Comments with lazy load (cursor pagination)
- Add comment with input field
- Real-time updates via WebSocket: new likes and comments appear instantly without reload
- Auto-reconnect WebSocket on disconnect
- Dark theme with design tokens

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://k8s.mectest.ru/test-app` | REST API base URL |
| `EXPO_PUBLIC_WS_URL` | `wss://k8s.mectest.ru/test-app/ws` | WebSocket URL |

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Then scan the QR code with **Expo Go** on your iOS or Android device.

## Project Structure

```
app/
  _layout.tsx        # Root layout: QueryClient, auth init, WS connect
  index.tsx          # Feed screen
  post/[id].tsx      # Post detail screen
src/
  api/
    client.ts        # Axios instance with auth interceptor
    posts.ts         # React Query hooks (usePosts, usePost, useLikePost, useComments, useAddComment)
  stores/
    authStore.ts     # MobX: UUID token management
    postStore.ts     # MobX: real-time likes/comments from WebSocket
  ws/
    wsService.ts     # WebSocket client with auto-reconnect
  components/
    Avatar.tsx
    TierBadge.tsx
    PostCard.tsx
    LikeButton.tsx   # Reanimated spring animation + haptics
    CommentItem.tsx  # FadeInDown animation for new WS comments
    CommentInput.tsx
    TabFilter.tsx
  theme/
    tokens.ts        # Design tokens: colors, spacing, typography, radius
  types/
    api.ts           # TypeScript interfaces for API models
```

## Auth

No registration required. On first launch a UUID v4 is generated and stored in AsyncStorage. It's used as the Bearer token for all API requests and as the WebSocket token. Each UUID has its own like state on the server.

## Commit History

Each step is committed separately — see git log for incremental progress.
