import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, AppState, type AppStateStatus } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { authStore } from '../src/stores/authStore';
import { wsService } from '../src/ws/wsService';
import { colors, typography, spacing, radius } from '../src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

// ─── Splash ───────────────────────────────────────────────────────────────────

function SplashScreen() {
  const opacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  return (
    <View style={splash.container}>
      <Animated.View style={[splash.row, wordmarkStyle]}>
        <Text style={splash.wordmark}>mecenate</Text>
        <Animated.View style={[splash.dot, dotStyle]} />
      </Animated.View>
    </View>
  );
}

// ─── Offline Banner ───────────────────────────────────────────────────────────

/**
 * Watches AppState to detect when the app goes background→foreground.
 * Uses the WebSocket connection status as a proxy for connectivity —
 * if WS is disconnected after coming to foreground, we're likely offline.
 * Shows a slim banner that slides in from the top.
 */
function useOfflineDetection() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Poll connectivity by attempting a lightweight fetch on foreground
    const check = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        await fetch(
          `${process.env.EXPO_PUBLIC_API_URL ?? 'https://k8s.mectest.ru/test-app'}/posts?limit=1`,
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => sub.remove();
  }, []);

  return offline;
}

function OfflineBanner() {
  const translateY = useSharedValue(-48);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) });
  }, []);

  return (
    <Animated.View style={[banner.container, animStyle]}>
      <Text style={banner.text}>⚡ Нет подключения к интернету</Text>
    </Animated.View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const offline = useOfflineDetection();

  useEffect(() => {
    authStore.init().then(() => {
      wsService.connect(authStore.token, queryClient);
      setReady(true);
    });
    return () => wsService.disconnect();
  }, []);

  if (!ready) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {offline && <OfflineBanner />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Mecenate', headerLargeTitle: true }} />
        <Stack.Screen
          name="post/[id]"
          options={{ title: '', headerBackTitle: 'Лента' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  wordmark: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 2,
  },
});

const banner = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
