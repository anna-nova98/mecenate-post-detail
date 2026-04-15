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
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<{ post: Post }>>(`/posts/${id}`);
      return res.data.data.post;
    },
    enabled: !!id,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}
