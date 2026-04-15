import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { ApiEnvelope, Post, PostsData, CommentsData, Comment } from '../types/api';

type TierFilter = 'all' | 'free' | 'paid';

// ─── Feed ────────────────────────────────────────────────────────────────────

export function usePosts(tier: TierFilter) {
  return useInfiniteQuery({
    queryKey: ['posts', tier],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 10 };
      if (pageParam) params.cursor = pageParam as string;
      if (tier !== 'all') params.tier = tier;
      const res = await apiClient.get<ApiEnvelope<PostsData>>('/posts', { params });
      return res.data.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

// ─── Post Detail ─────────────────────────────────────────────────────────────

export function usePost(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<{ post: Post }>>(`/posts/${id}`);
      return res.data.data.post;
    },
    enabled: !!id,
    // Seed from any feed cache page so the detail screen renders instantly
    // without a skeleton when the post was already visible in the feed.
    initialData: () => {
      const tiers: TierFilter[] = ['all', 'free', 'paid'];
      for (const tier of tiers) {
        const feed = qc.getQueryData<{ pages: PostsData[] }>(['posts', tier]);
        if (!feed) continue;
        for (const page of feed.pages) {
          const found = page.posts.find((p) => p.id === id);
          if (found) return found;
        }
      }
      return undefined;
    },
    // Treat seeded data as stale immediately so a fresh fetch still runs
    initialDataUpdatedAt: 0,
  });
}

// ─── Like ────────────────────────────────────────────────────────────────────

export function useLikePost(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiEnvelope<{ isLiked: boolean; likesCount: number }>>(
        `/posts/${postId}/like`
      );
      return res.data.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['post', postId] });
      const prev = qc.getQueryData<Post>(['post', postId]);
      if (prev) {
        qc.setQueryData<Post>(['post', postId], {
          ...prev,
          isLiked: !prev.isLiked,
          likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['post', postId], ctx.prev);
    },
  });
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 20 };
      if (pageParam) params.cursor = pageParam as string;
      const res = await apiClient.get<ApiEnvelope<CommentsData>>(`/posts/${postId}/comments`, {
        params,
      });
      return res.data.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await apiClient.post<ApiEnvelope<{ comment: Comment }>>(
        `/posts/${postId}/comments`,
        { text }
      );
      return res.data.data.comment;
    },
    onMutate: async (text: string) => {
      // Cancel any in-flight comment fetches
      await qc.cancelQueries({ queryKey: ['comments', postId] });

      // Snapshot for rollback
      const prevComments = qc.getQueryData(['comments', postId]);
      const prevPost = qc.getQueryData<Post>(['post', postId]);

      // Build a temporary optimistic comment
      const optimisticComment: Comment = {
        id: `optimistic-${Date.now()}`,
        postId,
        author: {
          id: 'me',
          username: 'me',
          displayName: 'Вы',
          avatarUrl: '',
          bio: '',
          subscribersCount: 0,
          isVerified: false,
        },
        text,
        createdAt: new Date().toISOString(),
      };

      // Prepend to the first page of the comments cache
      qc.setQueryData<{ pages: CommentsData[]; pageParams: unknown[] }>(
        ['comments', postId],
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, comments: [optimisticComment, ...firstPage.comments] },
              ...rest,
            ],
          };
        }
      );

      // Bump commentsCount optimistically
      if (prevPost) {
        qc.setQueryData<Post>(['post', postId], {
          ...prevPost,
          commentsCount: prevPost.commentsCount + 1,
        });
      }

      return { prevComments, prevPost, optimisticComment };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back both caches on failure
      if (ctx?.prevComments !== undefined) {
        qc.setQueryData(['comments', postId], ctx.prevComments);
      }
      if (ctx?.prevPost !== undefined) {
        qc.setQueryData(['post', postId], ctx.prevPost);
      }
    },
    onSuccess: (comment, _vars, ctx) => {
      // Replace the optimistic entry in-place with the real server comment —
      // avoids the flash caused by invalidation + refetch
      qc.setQueryData<{ pages: CommentsData[]; pageParams: unknown[] }>(
        ['comments', postId],
        (old) => {
          if (!old || !ctx?.optimisticComment) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              comments: page.comments.map((c) =>
                c.id === ctx.optimisticComment.id ? comment : c
              ),
            })),
          };
        }
      );
    },
  });
}
