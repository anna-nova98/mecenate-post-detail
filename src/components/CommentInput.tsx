import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';

const MAX_LENGTH = 500;

interface Props {
  onSubmit: (text: string) => Promise<void>;
}

export function CommentInput({ onSubmit }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const sendScale = useSharedValue(1);
  const animatedSendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !loading;
  const nearLimit = text.length > MAX_LENGTH * 0.8;
  const atLimit = text.length >= MAX_LENGTH;

  const handleSend = async () => {
    if (!canSend) return;
    // Button press animation
    sendScale.value = withSpring(0.85, { damping: 6 }, () => {
      sendScale.value = withSpring(1, { damping: 10 });
    });
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setText('');
      inputRef.current?.blur();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Написать комментарий..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={MAX_LENGTH}
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={handleSend}
      />
      <View style={styles.right}>
        {nearLimit && (
          <Text style={[styles.counter, atLimit && styles.counterLimit]}>
            {MAX_LENGTH - text.length}
          </Text>
        )}
        <Animated.View style={animatedSendStyle}>
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text style={[styles.sendIcon, !canSend && styles.sendIconDisabled]}>➤</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    color: colors.textPrimary,
    ...typography.body,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  right: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 2 : 0,
  },
  counter: {
    ...typography.caption,
    color: colors.textMuted,
  },
  counterLimit: {
    color: colors.error,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  sendIconDisabled: {
    color: colors.textMuted,
  },
});
