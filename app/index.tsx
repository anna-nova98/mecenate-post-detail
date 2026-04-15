import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { usePosts } from '../src/api/posts';
import { PostCard } from '../src/components/PostCard';
import { TabFilter, type FilterTab } from '../src/components/TabFilter';
import { SkeletonCard } from '../src/components/SkeletonCard';
import { LiveDot } from '../src/components/LiveDot';
import { ErrorView } from '../src/components/ErrorView';
import { colors, spacing, typography } from '../src/theme/tokens';
import type { Post } from '../src/types/api';

export default function FeedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<FilterTab>('all');
  const listRef = useRef<FlatList<Post>>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <LiveDot /> });
  }, [navigation]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = usePosts(filter);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleFilterChange = useCallback(
    (tab: FilterTab) => {
      setFilter(tab);
      // Scroll to top when switching tabs
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onPress={() => router.push(`/post/${item.id}`)} />
    ),
    [router]
  );

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null,
    [isFetchingNextPage]
  );

  if (isLoading) {
    return (
      <FlatList
        data={[1, 2, 3]}
        keyExtractor={(i) => String(i)}
        renderItem={() => <SkeletonCard />}
        ListHeaderComponent={<TabFilter active={filter} onChange={handleFilterChange} />}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />
    );
  }

  if (isError) {
    return <ErrorView message="Не удалось загрузить ленту" onRetry={refetch} />;
  }

  return (
    <FlatList
      ref={listRef}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      extraData={filter}
      ListHeaderComponent={<TabFilter active={filter} onChange={handleFilterChange} />}
      ListEmptyComponent={
        <View style={styles.empty}>
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
      windowSize={5}
      maxToRenderPerBatch={5}
      initialNumToRender={6}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
