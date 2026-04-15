import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../theme/tokens';

// Single shared pulse value so all bones animate in sync
function usePulse() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  return opacity;
}

interface BoneProps {
  opacity: Animated.SharedValue<number>;
  width: ViewStyle['width'];
  height: number;
  style?: ViewStyle;
}

function Bone({ opacity, width, height, style }: BoneProps) {
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius.sm, backgroundColor: colors.bgInput },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const opacity = usePulse();
  return (
    <View style={styles.card}>
      <Bone opacity={opacity} width="100%" height={160} style={{ borderRadius: 0 }} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Bone opacity={opacity} width={36} height={36} style={{ borderRadius: 18 }} />
          <View style={styles.authorLines}>
            <Bone opacity={opacity} width="50%" height={12} />
            <Bone opacity={opacity} width="30%" height={10} />
          </View>
        </View>
        <Bone opacity={opacity} width="85%" height={16} />
        <Bone opacity={opacity} width="100%" height={12} />
        <Bone opacity={opacity} width="70%" height={12} />
        <View style={styles.statsRow}>
          <Bone opacity={opacity} width={48} height={12} />
          <Bone opacity={opacity} width={48} height={12} />
        </View>
      </View>
    </View>
  );
}

// Skeleton for the post detail header (cover + author + title + body lines)
export function SkeletonDetail() {
  const opacity = usePulse();
  return (
    <View>
      {/* Cover */}
      <Bone opacity={opacity} width="100%" height={260} style={{ borderRadius: 0 }} />
      <View style={styles.detailBody}>
        {/* Author row */}
        <View style={styles.row}>
          <Bone opacity={opacity} width={44} height={44} style={{ borderRadius: 22 }} />
          <View style={styles.authorLines}>
            <Bone opacity={opacity} width="45%" height={14} />
            <Bone opacity={opacity} width="60%" height={11} />
          </View>
        </View>
        {/* Title */}
        <Bone opacity={opacity} width="90%" height={22} />
        <Bone opacity={opacity} width="55%" height={22} />
        {/* Date */}
        <Bone opacity={opacity} width="30%" height={11} />
        {/* Body lines */}
        <View style={styles.bodyLines}>
          <Bone opacity={opacity} width="100%" height={14} />
          <Bone opacity={opacity} width="100%" height={14} />
          <Bone opacity={opacity} width="100%" height={14} />
          <Bone opacity={opacity} width="75%" height={14} />
        </View>
        {/* Actions */}
        <View style={styles.actionsRow}>
          <Bone opacity={opacity} width={80} height={36} style={{ borderRadius: radius.full }} />
          <Bone opacity={opacity} width={80} height={36} style={{ borderRadius: radius.full }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorLines: {
    flex: 1,
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  detailBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bodyLines: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
