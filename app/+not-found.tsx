import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Страница не найдена' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Страница не найдена</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Вернуться в ленту</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary, fontSize: 64 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  link: { marginTop: spacing.lg },
  linkText: { ...typography.label, color: colors.primary },
});
