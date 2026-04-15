import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { TierBadge } from './TierBadge';
import { colors, spacing, radius, typography, shadows } from '../theme/tokens';
import type { Post } from '../types/api';

interface Props {
  post: Post;
  onPress: () => void;
}

export function PostCard({ post, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Cover */}
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <Avatar uri={post.author.avatarUrl} size={32} displayName={post.author.displayName} />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.author.displayName}
              </Text>
              {post.author.isVerified && (
                <Text style={styles.verified}>✓</Text>
              )}
            </View>
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          </View>
          <TierBadge tier={post.tier} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {/* Preview */}
        {post.preview ? (
          <Text style={styles.preview} numberOfLines={3}>
            {post.preview}
          </Text>
        ) : null}

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.stat}>♥ {post.likesCount}</Text>
          <Text style={styles.stat}>💬 {post.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

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
  cover: {
    width: '100%',
    height: 180,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    ...typography.label,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  verified: {
    color: colors.verified,
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  stat: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
