import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../theme/tokens';

function Bone({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius: radius.sm, backgroundColor: colors.bgInput },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Bone width="100%" height={160} style={{ borderRadius: 0 }} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Bone width={36} height={36} style={{ borderRadius: 18 }} />
          <View style={{ gap: 6, flex: 1 }}>
            <Bone width="50%" height={12} />
            <Bone width="30%" height={10} />
          </View>
        </View>
        <Bone width="90%" height={16} />
        <Bone width="100%" height={12} />
        <Bone width="75%" height={12} />
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
});
