import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { usePost, useComments, useLikePost, useAddComment } from '../../src/api/posts';
import { postStore } from '../../src/stores/postStore';
import { Avatar } from '../../src/components/Avatar';
import { TierBadge } from '../../src/components/TierBadge';
import { LikeButton } from '../../src/components/LikeButton';
import { CommentItem } from '../../src/components/CommentItem';
import { CommentInput } from '../../src/components/CommentInput';
import { colors, spacing, radius, typography } from '../../src/theme/tokens';
import type { Comment } from '../../src/types/api';

const PostDetailScreen = observer(() => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const { data: post, isLoading: postLoading, isError: postError } = usePost(id);
  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: commentsLoading,
  } = useComments(id);

  const likeMutation = useLikePost(id);
  const addCommentMutation = useAddComment(id);

  // Live state from MobX (WS updates)
  const liveState = postStore.getLiveState(id);
  const liveComments = postStore.getLiveComments(id);

  const likesCount = liveState?.likesCount ?? post?.likesCount ?? 0;
  const isLiked = liveState?.isLiked ?? post?.isLiked ?? false;

  // Sync like mutation result into MobX store
  useEffect(() => {
    if (post) {
      const current = postStore.getLiveState(id);
      if (!current) {
        postStore.setLiked(id, post.isLiked, post.likesCount);
      }
    }
  }, [post, id]);

  useLayoutEffect(() => {
    if (post?.title) {
      navigation.setOptions({ title: post.title });
    }
  }, [post?.title, navigation]);

  // Flatten paginated comments
  const paginatedComments = useMemo(
    () => commentsData?.pages.flatMap((p) => p.comments) ?? [],
    [commentsData]
  );

  // Merge live (WS) comments with paginated, dedup by id
  const allComments = useMemo(() => {
    const ids = new Set(paginatedComments.map((c) => c.id));
    const newOnes = liveComments.filter((c) => !ids.has(c.id));
    return [...newOnes, ...paginatedComments];
  }, [liveComments, paginatedComments]);

  const handleLike = useCallback(async () => {
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    postStore.setLiked(id, newIsLiked, newCount);
    try {
      const result = await likeMutation.mutateAsync();
      postStore.setLiked(id, result.isLiked, result.likesCount);
    } catch {
      // revert
      postStore.setLiked(id, isLiked, likesCount);
    }
  }, [id, isLiked, likesCount, likeMutation]);

  const handleAddComment = useCallback(
    async (text: string) => {
      await addCommentMutation.mutateAsync(text);
    },
    [addCommentMutation]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => {
      const isNew = liveComments.some((c) => c.id === item.id);
      return <CommentItem comment={item} isNew={isNew} />;
    },
    [liveComments]
  );

  if (postLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (postError || !post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Публикация не найдена</Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      {/* Cover */}
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.content}>
        {/* Author */}
        <View style={styles.authorRow}>
          <Avatar uri={post.author.avatarUrl} size={44} displayName={post.author.displayName} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.author.displayName}</Text>
              {post.author.isVerified && <Text style={styles.verified}>✓</Text>}
            </View>
            <Text style={styles.meta}>
              @{post.author.username} · {post.author.subscribersCount.toLocaleString('ru-RU')} подписчиков
            </Text>
          </View>
          <TierBadge tier={post.tier} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(post.createdAt)}</Text>

        {/* Body */}
        {post.body ? (
          <Text style={styles.body}>{post.body}</Text>
        ) : (
          <View style={styles.lockedBox}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Платный контент</Text>
            <Text style={styles.lockedSub}>Оформите подписку, чтобы читать полный текст</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <LikeButton
            isLiked={isLiked}
            likesCount={likesCount}
            onPress={handleLike}
            disabled={likeMutation.isPending}
          />
          <View style={styles.commentCount}>
            <Text style={styles.commentCountText}>💬 {post.commentsCount}</Text>
          </View>
        </View>

        {/* Comments header */}
        <Text style={styles.commentsHeader}>Комментарии</Text>
      </View>
    </View>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={styles.loadingMore}>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <FlatList
        data={allComments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          commentsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>Комментариев пока нет. Будьте первым!</Text>
            </View>
          )
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <CommentInput onSubmit={handleAddComment} />
    </View>
  );
});

export default PostDetailScreen;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  cover: {
    width: '100%',
    height: 260,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  verified: {
    color: colors.verified,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  lockedBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedIcon: {
    fontSize: 32,
  },
  lockedTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  lockedSub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  commentCount: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentCountText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  commentsHeader: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  loadingMore: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyComments: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
