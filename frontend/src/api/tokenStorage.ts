/**
 * File: react/project/src/api/tokenStorage.ts
 * Author: Frank Seely (fseely@bu.edu), 4/27/2026
 * Description: Secure token persistence utilities used by auth and API clients.
 */


import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'accessToken';

export const tokenStorage = {
  getAccessToken: async () => {
    if (Platform.OS === 'web') return localStorage.getItem(ACCESS_TOKEN_KEY);
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setToken: async (access: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      return;
    }
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  },
  clearToken: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};