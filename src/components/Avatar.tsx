import React, { useState } from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '../theme/tokens';

interface Props {
  uri?: string;
  size?: number;
  displayName?: string;
}

export function Avatar({ uri, size = 40, displayName }: Props) {
  const initials = displayName
    ? displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  // React Native cannot render .webm (video) as an image — fall back to initials
  const isRenderable = uri && !uri.endsWith('.webm') && !uri.endsWith('.mp4');

  const imageOpacity = useSharedValue(0);
  const animatedImageStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));

  const handleLoad = () => {
    imageOpacity.value = withTiming(1, { duration: 250 });
  };

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {/* Initials always rendered underneath as fallback */}
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>

      {isRenderable && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
            onLoad={handleLoad}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgInput,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
