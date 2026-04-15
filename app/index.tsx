import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { usePosts } from '../src/api/posts';
import { PostCard } from '../src/components/PostCard';
import { TabFilter, type FilterTab } from '../src/components/TabFilter';
import { SkeletonCard } from '../src/components/SkeletonCard';
import { LiveDot } from '../src/components/LiveDot';
import { colors, spacing, typography } from '../src/theme/tokens';
import type { Post } from '../src/types/api';

export default function FeedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<FilterTab>('all');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <LiveDot />,
    });
  }, [navigation]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, isRefetching } =
    usePosts(filter);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onPress={() => router.push(`/post/${item.id}`)} />
    ),
    [router]
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <FlatList
        data={[1, 2, 3]}
        keyExtractor={(i) => String(i)}
        renderItem={() => <SkeletonCard />}
        ListHeaderComponent={<TabFilter active={filter} onChange={setFilter} />}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Не удалось загрузить ленту</Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          Повторить
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <TabFilter active={filter} onChange={(t) => setFilter(t)} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Публикаций нет</Text>
        </View>
      }
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  retryText: {
    ...typography.label,
    color: colors.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
