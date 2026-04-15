import { makeAutoObservable, action } from 'mobx';
import type { Comment } from '../types/api';

interface PostLiveState {
  likesCount: number;
  isLiked: boolean;
}

class PostStore {
  // Real-time overrides keyed by postId
  liveStates: Map<string, PostLiveState> = new Map();
  // Real-time comments prepended per postId
  liveComments: Map<string, Comment[]> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  updateLikes = action((postId: string, likesCount: number) => {
    const current = this.liveStates.get(postId);
    // Preserve existing isLiked; if no state yet, we can't know — keep false as default
    this.liveStates.set(postId, {
      likesCount,
      isLiked: current?.isLiked ?? false,
    });
  });

  setLiked = action((postId: string, isLiked: boolean, likesCount: number) => {
    this.liveStates.set(postId, { isLiked, likesCount });
  });

  prependComment = action((postId: string, comment: Comment) => {
    const existing = this.liveComments.get(postId) ?? [];
    // Avoid duplicates
    if (existing.some((c) => c.id === comment.id)) return;
    this.liveComments.set(postId, [comment, ...existing]);
  });

  getLiveState(postId: string) {
    return this.liveStates.get(postId);
  }

  getLiveComments(postId: string): Comment[] {
    return this.liveComments.get(postId) ?? [];
  }

  clearPost(postId: string) {
    this.liveStates.delete(postId);
    this.liveComments.delete(postId);
  }
}

export const postStore = new PostStore();
