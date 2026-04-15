import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme/tokens';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({ message = 'Что-то пошло не так', onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.btnText}>Повторить</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  icon: { fontSize: 40 },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  btnText: {
    ...typography.label,
    color: colors.textPrimary,
  },
});
