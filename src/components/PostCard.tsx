import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { observer } from 'mobx-react-lite';
import { Avatar } from './Avatar';
import { TierBadge } from './TierBadge';
import { postStore } from '../stores/postStore';
import { colors, spacing, radius, typography, shadows } from '../theme/tokens';
import type { Post } from '../types/api';

interface Props {
  post: Post;
  onPress: () => void;
}

export const PostCard = observer(function PostCard({ post, onPress }: Props) {
  const liveState = postStore.getLiveState(post.id);
  const likesCount = liveState?.likesCount ?? post.likesCount;
  const liveCommentCount =
    post.commentsCount + postStore.getLiveComments(post.id).length;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, [scale]);

  const isPaid = post.tier === 'paid';

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.border }}
      >
        {/* Cover with optional paywall overlay */}
        {post.coverUrl ? (
          <View style={styles.coverContainer}>
            <Image source={{ uri: post.coverUrl }} style={styles.cover} resizeMode="cover" />
            {isPaid && !post.body && (
              <View style={styles.paywallOverlay}>
                <View style={styles.paywallDot} />
                <Text style={styles.paywallText}>
                  Кто ещё не подписался на меня,{'\n'}поспешите оформить подписку
                </Text>
                <View style={styles.paywallBtn}>
                  <Text style={styles.paywallBtnText}>Оформить подписку</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>

          {/* Preview */}
          {post.preview ? (
            <Text style={styles.preview} numberOfLines={2}>
              {post.preview}
            </Text>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Text style={styles.stat}>♥ {likesCount}</Text>
            <Text style={styles.stat}>💬 {liveCommentCount}</Text>
          </View>

          {/* Author row at bottom */}
          <View style={styles.authorRow}>
            <Avatar uri={post.author.avatarUrl} size={28} displayName={post.author.displayName} />
            <Text style={styles.authorName} numberOfLines={1}>
              {post.author.displayName}
            </Text>
            {post.author.isVerified && (
              <Text style={styles.verified}>✓</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  coverContainer: {
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: 200,
  },
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80, 20, 160, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  paywallDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: spacing.xs,
  },
  paywallText: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  paywallBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  paywallBtnText: {
    ...typography.label,
    color: '#FFFFFF',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  authorName: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  verified: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
