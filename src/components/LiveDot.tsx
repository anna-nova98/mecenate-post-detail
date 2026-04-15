import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { observer } from 'mobx-react-lite';
import { wsStatusStore } from '../stores/wsStatusStore';
import { colors, spacing, typography } from '../theme/tokens';

export const LiveDot = observer(() => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (wsStatusStore.connected) {
      opacity.value = withRepeat(withTiming(0.2, { duration: 900 }), -1, true);
    } else {
      opacity.value = 1;
    }
  }, [wsStatusStore.connected]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: wsStatusStore.connected ? colors.success : colors.textMuted },
          animStyle,
        ]}
      />
      <Text style={styles.label}>{wsStatusStore.connected ? 'Live' : 'Offline'}</Text>
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
