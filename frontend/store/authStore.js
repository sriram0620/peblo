'use client';

import { create } from 'zustand';
import { authAPI } from '@/lib/api';

/**
 * Authentication state store
 * Handles login, signup, logout, and session persistence via localStorage
 */
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  /**
   * Initialize auth state from localStorage
   */
  initialize: async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('peblo_token');
    const userStr = localStorage.getItem('peblo_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });

        // Verify token is still valid
        const res = await authAPI.me();
        set({ user: res.data });
        localStorage.setItem('peblo_user', JSON.stringify(res.data));
      } catch {
        // Token invalid, clear state
        get().logout();
      }
    } else {
      set({ isLoading: false });
    }
  },

  /**
   * Sign up a new user
   */
  signup: async ({ name, email, password }) => {
    const res = await authAPI.signup({ name, email, password });
    const { user, token } = res.data;

    localStorage.setItem('peblo_token', token);
    localStorage.setItem('peblo_user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  /**
   * Log in an existing user
   */
  login: async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data;

    localStorage.setItem('peblo_token', token);
    localStorage.setItem('peblo_user', JSON.stringify(user));

    set({ user, token, isAuthenticated: true, isLoading: false });
    return user;
  },

  /**
   * Log out and clear session
   */
  logout: () => {
    localStorage.removeItem('peblo_token');
    localStorage.removeItem('peblo_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));

export default useAuthStore;
