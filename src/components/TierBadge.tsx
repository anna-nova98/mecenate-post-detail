import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

interface Props {
  tier: 'free' | 'paid';
}

export function TierBadge({ tier }: Props) {
  const isPaid = tier === 'paid';
  return (
    <View style={[styles.badge, { backgroundColor: isPaid ? colors.paid + '22' : colors.free + '22' }]}>
      <Text style={[styles.text, { color: isPaid ? colors.paid : colors.free }]}>
        {isPaid ? '🔒 Платный' : '✓ Бесплатно'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
