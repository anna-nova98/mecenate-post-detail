import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  FadeOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography } from '../theme/tokens';

interface Props {
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
  disabled?: boolean;
}

export function LikeButton({ isLiked, likesCount, onPress, disabled }: Props) {
  const scale = useSharedValue(1);
  const prevCountRef = useRef(likesCount);
  const countIncreased = likesCount > prevCountRef.current;
  const countChanged = prevCountRef.current !== likesCount;

  useEffect(() => {
    prevCountRef.current = likesCount;
  }, [likesCount]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(
      isLiked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    scale.value = withSequence(
      withSpring(1.45, { damping: 4, stiffness: 350 }),
      withSpring(0.88, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.button, isLiked && styles.buttonActive]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.Text style={[styles.icon, animatedIconStyle]}>
        {isLiked ? '❤️' : '🤍'}
      </Animated.Text>

      {/* Directional number ticker: slides up when count increases, down when it decreases */}
      <View style={styles.countContainer}>
        <Animated.Text
          key={likesCount}
          entering={
            countChanged
              ? (countIncreased ? FadeInDown : FadeInUp).duration(200).springify()
              : undefined
          }
          exiting={
            countChanged
              ? (countIncreased ? FadeOutUp : FadeOutDown).duration(150)
              : undefined
          }
          style={[styles.count, isLiked && styles.countActive]}
        >
          {formatCount(likesCount)}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonActive: {
    backgroundColor: colors.like + '22',
    borderColor: colors.like + '66',
  },
  icon: {
    fontSize: 18,
  },
  countContainer: {
    minWidth: 28,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  count: {
    ...typography.label,
    color: colors.textSecondary,
  },
  countActive: {
    color: colors.like,
  },
});
