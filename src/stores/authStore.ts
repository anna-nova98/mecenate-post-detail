import 'react-native-get-random-values';
import { makeAutoObservable } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'mecenate_user_token';

class AuthStore {
  token: string = '';

  constructor() {
    makeAutoObservable(this);
  }

  setToken(token: string) {
    this.token = token;
  }

  async init() {
    try {
      let stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        stored = uuidv4();
        await AsyncStorage.setItem(STORAGE_KEY, stored);
      }
      this.setToken(stored);
    } catch {
      this.setToken(uuidv4());
    }
  }
}

export const authStore = new AuthStore();
