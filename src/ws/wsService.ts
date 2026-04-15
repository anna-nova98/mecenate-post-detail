import { AppState, type AppStateStatus } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { postStore } from '../stores/postStore';
import { wsStatusStore } from '../stores/wsStatusStore';
import type { WsEvent, Post } from '../types/api';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'wss://k8s.mectest.ru/test-app/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

class WsService {
  private ws: WebSocket | null = null;
  private token: string = '';
  private qc: QueryClient | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private shouldConnect = false;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  connect(token: string, queryClient: QueryClient) {
    this.token = token;
    this.qc = queryClient;
    this.shouldConnect = true;
    this.attempts = 0;
    this._open();
    this._listenAppState();
  }

  disconnect() {
    this.shouldConnect = false;
    this._clearTimer();
    wsStatusStore.setConnected(false);
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private _listenAppState() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.attempts = 0;
            this._open();
          }
        }
      }
    );
  }

  private _open() {
    if (!this.shouldConnect || !this.token) return;
    try {
      this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);
      this.ws.onopen = () => {
        this.attempts = 0;
        wsStatusStore.setConnected(true);
        console.log('[WS] Connected');
      };
      this.ws.onmessage = (e) => this._handleMessage(e.data);
      this.ws.onerror = (e) => console.warn('[WS] Error', e);
      this.ws.onclose = () => {
        wsStatusStore.setConnected(false);
        console.log('[WS] Closed, reconnecting...');
        this._scheduleReconnect();
      };
    } catch (err) {
      console.warn('[WS] Failed to open', err);
      this._scheduleReconnect();
    }
  }

  private _handleMessage(raw: string) {
    try {
      const event: WsEvent = JSON.parse(raw);
      if (event.type === 'ping') return;

      if (event.type === 'like_updated') {
        // Update MobX store (post detail real-time)
        postStore.updateLikes(event.postId, event.likesCount);
        // Also patch the React Query cache so feed cards update
        this.qc?.setQueryData<Post>(['post', event.postId], (old) =>
          old ? { ...old, likesCount: event.likesCount } : old
        );
      }

      if (event.type === 'comment_added') {
        // Update MobX store (post detail real-time)
        postStore.prependComment(event.postId, event.comment);
        // Bump commentsCount in the post cache
        this.qc?.setQueryData<Post>(['post', event.postId], (old) =>
          old ? { ...old, commentsCount: old.commentsCount + 1 } : old
        );
      }
    } catch {
      // ignore malformed messages
    }
  }

  private _scheduleReconnect() {
    if (!this.shouldConnect) return;
    if (this.attempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.attempts++;
    this._clearTimer();
    this.reconnectTimer = setTimeout(() => this._open(), RECONNECT_DELAY);
  }

  private _clearTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const wsService = new WsService();
