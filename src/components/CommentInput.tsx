import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !loading;
  const nearLimit = text.length > MAX_LENGTH * 0.8;

  const handleSend = async () => {
    if (!canSend) return;
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Написать комментарий..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={MAX_LENGTH}
          blurOnSubmit
          onSubmitEditing={handleSend}
        />
        <View style={styles.right}>
          {nearLimit && (
            <Text style={[styles.counter, text.length >= MAX_LENGTH && styles.counterLimit]}>
              {MAX_LENGTH - text.length}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  right: {
    alignItems: 'center',
    gap: spacing.xs,
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
  },
  sendIcon: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
