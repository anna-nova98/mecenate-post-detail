import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme/tokens';

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

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {isRenderable ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
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
