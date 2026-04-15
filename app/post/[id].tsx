import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { usePost, useComments, useLikePost, useAddComment } from '../../src/api/posts';
import { postStore } from '../../src/stores/postStore';
import { Avatar } from '../../src/components/Avatar';
import { TierBadge } from '../../src/components/TierBadge';
import { LikeButton } from '../../src/components/LikeButton';
import { CommentItem } from '../../src/components/CommentItem';
import { CommentInput } from '../../src/components/CommentInput';
import { ErrorView } from '../../src/components/ErrorView';
import { colors, spacing, radius, typography } from '../../src/theme/tokens';
import type { Comment } from '../../src/types/api';

const PostDetailScreen = observer(() => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const { data: post, isLoading: postLoading, isError: postError, refetch } = usePost(id);
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

  // Merge paginated + live comments, deduplicating by id
  const paginatedComments = useMemo(
    () => commentsData?.pages.flatMap((p) => p.comments) ?? [],
    [commentsData]
  );
  const paginatedIds = useMemo(
    () => new Set(paginatedComments.map((c) => c.id)),
    [paginatedComments]
  );
  const newLiveComments = useMemo(
    () => liveComments.filter((c) => !paginatedIds.has(c.id)),
    [liveComments, paginatedIds]
  );
  const allComments = useMemo(
    () => [...newLiveComments, ...paginatedComments],
    [newLiveComments, paginatedComments]
  );
  const liveCommentsCount = (post?.commentsCount ?? 0) + newLiveComments.length;

  // Seed MobX with initial post state once loaded
  useEffect(() => {
    if (post && !postStore.getLiveState(id)) {
      postStore.setLiked(id, post.isLiked, post.likesCount);
    }
  }, [post, id]);

  // Clean up live state when leaving screen
  useEffect(() => {
    return () => {
      postStore.clearPost(id);
    };
  }, [id]);

  useLayoutEffect(() => {
    if (post?.title) {
      navigation.setOptions({
        title: post.title,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' as const },
      });
    }
  }, [post?.title, navigation]);

  const handleLike = useCallback(async () => {
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    postStore.setLiked(id, newIsLiked, newCount);
    try {
      const result = await likeMutation.mutateAsync();
      postStore.setLiked(id, result.isLiked, result.likesCount);
    } catch {
      // Roll back optimistic update
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
    ({ item }: { item: Comment }) => (
      <CommentItem comment={item} isNew={newLiveComments.some((c) => c.id === item.id)} />
    ),
    [newLiveComments]
  );

  if (postLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (postError || !post) {
    return <ErrorView message="Публикация не найдена" onRetry={refetch} />;
  }

  const ListHeader = (
    <View>
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.content}>
        {/* Author */}
        <View style={styles.authorRow}>
          <Avatar uri={post.author.avatarUrl} size={44} displayName={post.author.displayName} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.author.displayName}
              </Text>
              {post.author.isVerified && <Text style={styles.verified}>✓</Text>}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              @{post.author.username} · {post.author.subscribersCount.toLocaleString('ru-RU')} подписчиков
            </Text>
          </View>
          <TierBadge tier={post.tier} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.date}>{formatDate(post.createdAt)}</Text>

        {/* Body or paywall */}
        {post.body ? (
          <Text style={styles.body}>{post.body}</Text>
        ) : (
          <PaywallBox />
        )}

        {/* Actions row */}
        <View style={styles.actions}>
          <LikeButton
            isLiked={isLiked}
            likesCount={likesCount}
            onPress={handleLike}
            disabled={likeMutation.isPending}
          />
          <View style={styles.commentCountBadge}>
            <Text style={styles.commentCountText}>💬 {liveCommentsCount}</Text>
          </View>
        </View>

        <Text style={styles.commentsHeader}>Комментарии</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        data={allComments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          commentsLoading ? (
            <View style={styles.commentsLoading}>
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
        keyboardDismissMode="interactive"
        windowSize={5}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />
      <CommentInput onSubmit={handleAddComment} />
    </KeyboardAvoidingView>
  );
});

export default PostDetailScreen;

// ─── Paywall ─────────────────────────────────────────────────────────────────

function PaywallBox() {
  return (
    <View style={styles.lockedBox}>
      <Text style={styles.lockedIcon}>🔒</Text>
      <Text style={styles.lockedTitle}>Платный контент</Text>
      <Text style={styles.lockedSub}>
        Оформите подписку на автора, чтобы читать полный текст публикации
      </Text>
      <TouchableOpacity style={styles.subscribeBtn} activeOpacity={0.85}>
        <Text style={styles.subscribeBtnText}>Подписаться</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  cover: { width: '100%', height: 260 },
  content: { padding: spacing.lg, gap: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { ...typography.h3, color: colors.textPrimary, flexShrink: 1 },
  verified: { color: colors.verified, fontSize: 14, fontWeight: '700' },
  meta: { ...typography.bodySmall, color: colors.textMuted },
  title: { ...typography.h1, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textMuted },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  lockedBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedIcon: { fontSize: 36 },
  lockedTitle: { ...typography.h3, color: colors.textPrimary },
  lockedSub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  subscribeBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  subscribeBtnText: { ...typography.label, color: colors.textPrimary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  commentCountBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentCountText: { ...typography.label, color: colors.textSecondary },
  commentsHeader: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  commentsLoading: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingMore: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyComments: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted },
});
