import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../theme/tokens';

export type FilterTab = 'all' | 'free' | 'paid';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'free', label: 'Бесплатные' },
  { key: 'paid', label: 'Платные' },
];

interface Props {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
}

export function TabFilter({ active, onChange }: Props) {
  // Store each tab's measured x + width so we can position the sliding pill
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const [measured, setMeasured] = useState(false);

  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  const handleLayout = (key: FilterTab) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };

    // Once all tabs are measured, position the pill on the active tab
    if (Object.keys(tabLayouts.current).length === TABS.length) {
      const layout = tabLayouts.current[active];
      if (layout) {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
        setMeasured(true);
      }
    }
  };

  const handlePress = (key: FilterTab) => {
    onChange(key);
    const layout = tabLayouts.current[key];
    if (layout) {
      pillX.value = withSpring(layout.x, { damping: 20, stiffness: 300 });
      pillWidth.value = withSpring(layout.width, { damping: 20, stiffness: 300 });
    }
  };

  return (
    <View style={styles.container}>
      {/* Sliding pill background */}
      {measured && (
        <Animated.View style={[styles.pill, pillStyle]} />
      )}

      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onLayout={handleLayout(tab.key)}
            onPress={() => handlePress(tab.key)}
            hitSlop={4}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    zIndex: 1,
    // Transparent border to match the non-pill tabs' sizing exactly
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
