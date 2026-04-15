import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
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
  const countScale = useSharedValue(1);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  // Animate when likesCount changes (real-time WS update)
  useEffect(() => {
    countScale.value = withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1, { damping: 8 })
    );
  }, [likesCount]);

  const handlePress = async () => {
    if (disabled) return;
    // Haptic feedback
    await Haptics.impactAsync(
      isLiked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    // Icon bounce animation
    scale.value = withSequence(
      withSpring(1.4, { damping: 5, stiffness: 300 }),
      withSpring(0.9, { damping: 8 }),
      withSpring(1, { damping: 10 })
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
      <Animated.Text style={[styles.count, isLiked && styles.countActive, animatedCountStyle]}>
        {likesCount}
      </Animated.Text>
    </TouchableOpacity>
  );
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
  count: {
    ...typography.label,
    color: colors.textSecondary,
  },
  countActive: {
    color: colors.like,
  },
});
