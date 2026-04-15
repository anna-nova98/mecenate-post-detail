import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { colors, spacing, radius, typography } from '../theme/tokens';
import type { Comment } from '../types/api';

interface Props {
  comment: Comment;
  isNew?: boolean;
}

export function CommentItem({ comment, isNew }: Props) {
  return (
    <Animated.View
      entering={isNew ? FadeInDown.duration(300).springify() : undefined}
      style={styles.container}
    >
      <Avatar uri={comment.author.avatarUrl} size={36} displayName={comment.author.displayName} />
      <View style={styles.bubble}>
        <View style={styles.header}>
          <Text style={styles.name}>{comment.author.displayName}</Text>
          {comment.author.isVerified && <Text style={styles.verified}>✓</Text>}
          <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.text}>{comment.text}</Text>
      </View>
    </Animated.View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    ...typography.label,
    color: colors.textPrimary,
  },
  verified: {
    color: colors.verified,
    fontSize: 11,
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
