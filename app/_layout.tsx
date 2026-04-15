import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
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
import { colors, typography, spacing } from '../src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function SplashScreen() {
  const opacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Fade in the wordmark
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    // Pulse the dot
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

export default function RootLayout() {
  const [ready, setReady] = useState(false);

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
    marginBottom: 2, // optical alignment with baseline
  },
});
