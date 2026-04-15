export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  subscribersCount: number;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: Author;
  title: string;
  body: string;
  preview: string;
  coverUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  tier: 'free' | 'paid';
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  text: string;
  createdAt: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
}

export interface ApiError {
  ok: false;
  error: { code: string; message: string };
}

export interface PostsData {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentsData {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

// WebSocket event types
export type WsEvent =
  | { type: 'ping' }
  | { type: 'like_updated'; postId: string; likesCount: number }
  | { type: 'comment_added'; postId: string; comment: Comment };
