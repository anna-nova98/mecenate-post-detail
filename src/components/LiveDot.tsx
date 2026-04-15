import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { wsStatusStore } from '../stores/wsStatusStore';
import { colors, spacing, typography } from '../theme/tokens';

export const LiveDot = observer(() => {
  // 0 = disconnected, 1 = connected
  const connected = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const dispose = reaction(
      () => wsStatusStore.connected,
      (isConnected) => {
        connected.value = withSpring(isConnected ? 1 : 0, { damping: 14, stiffness: 200 });

        cancelAnimation(pulse);
        if (isConnected) {
          pulse.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
        } else {
          pulse.value = withTiming(1, { duration: 200 });
        }
      },
      { fireImmediately: true }
    );
    return dispose;
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    backgroundColor: interpolateColor(
      connected.value,
      [0, 1],
      [colors.textMuted, colors.success]
    ),
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, dotStyle]} />
      <Text style={styles.label}>
        {wsStatusStore.connected ? 'Live' : 'Offline'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
