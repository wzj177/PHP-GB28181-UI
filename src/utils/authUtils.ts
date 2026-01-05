// authUtils.ts - 封装认证相关的工具函数

// Token storage keys
const TOKEN_KEY = 'token';
const TOKEN_KEY_NAME = 'tokenKey';

// Cookie utility functions
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, hours: number = 24): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
};

const removeCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

// Authentication utility functions
export const authUtils = {
  // Get token from cookie first (优先使用 cookie), then localStorage
  getToken(): string | null {
    // First check cookie (优先)
    let token = getCookie(TOKEN_KEY);
    if (token) return token;

    // Then check localStorage as fallback
    token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Sync to cookie for next time
      setCookie(TOKEN_KEY, token);
    }

    return token;
  },

  // Store token in both cookie (primary) and localStorage (backup)
  setToken(token: string, hours: number = 24): void {
    // Remove any existing token first to ensure clean state
    this.removeToken();

    // Store in cookie (primary storage)
    setCookie(TOKEN_KEY, token, hours);

    // Store in localStorage as backup
    localStorage.setItem(TOKEN_KEY, token);
  },

  setTokenKey(key: string): void {
    // Store in cookie
    setCookie(TOKEN_KEY_NAME, key);
    // Also store in localStorage for easy access
    localStorage.setItem(TOKEN_KEY_NAME, key);
  },

  getTokenKey(): string | null {
    // Check cookie first
    let key = getCookie(TOKEN_KEY_NAME);
    if (key) return key;

    // Fallback to localStorage
    return localStorage.getItem(TOKEN_KEY_NAME);
  },

  removeTokenKey(): void {
    removeCookie(TOKEN_KEY_NAME);
    localStorage.removeItem(TOKEN_KEY_NAME);
  },

  // Remove token from both cookie and localStorage
  removeToken(): void {
    // Remove from cookie
    removeCookie(TOKEN_KEY);

    // Remove from localStorage
    localStorage.removeItem(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Clear all auth data
  clear() {
    this.removeToken();
    this.removeTokenKey();
  }
};