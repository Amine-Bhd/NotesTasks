import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key).catch((error) => {
      console.warn('SecureStore get error:', error);
      return null;
    });
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value).catch((error) => {
      console.warn('SecureStore set error:', error);
    });
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key).catch((error) => {
      console.warn('SecureStore delete error:', error);
    });
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? AsyncStorage : ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
