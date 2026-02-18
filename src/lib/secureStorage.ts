import { Preferences } from '@capacitor/preferences';
import { isNative } from './capacitor';

const STORAGE_KEYS = {
  REMEMBER_ME: 'coparenting_remember_me',
  LAST_ACTIVE: 'coparenting_last_active',
  SESSION_TIMEOUT_DAYS: 30,
};

export class SecureStorage {
  private static async setItem(key: string, value: string): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key, value });
    } else {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }

  private static async getItem(key: string): Promise<string | null> {
    if (isNative()) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Failed to read from localStorage:', error);
        return null;
      }
    }
  }

  private static async removeItem(key: string): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key });
    } else {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    }
  }

  static async setRememberMe(enabled: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.REMEMBER_ME, enabled ? 'true' : 'false');
    if (enabled) {
      await this.updateLastActive();
    } else {
      await this.removeItem(STORAGE_KEYS.LAST_ACTIVE);
    }
  }

  static async getRememberMe(): Promise<boolean> {
    const value = await this.getItem(STORAGE_KEYS.REMEMBER_ME);
    return value === 'true';
  }

  static async updateLastActive(): Promise<void> {
    const rememberMe = await this.getRememberMe();
    if (rememberMe) {
      await this.setItem(STORAGE_KEYS.LAST_ACTIVE, new Date().toISOString());
    }
  }

  static async isSessionValid(): Promise<boolean> {
    const rememberMe = await this.getRememberMe();
    if (!rememberMe) {
      return false;
    }

    const lastActiveStr = await this.getItem(STORAGE_KEYS.LAST_ACTIVE);
    if (!lastActiveStr) {
      return false;
    }

    try {
      const lastActive = new Date(lastActiveStr);
      const now = new Date();
      const diffDays = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays < STORAGE_KEYS.SESSION_TIMEOUT_DAYS;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  static async clearAuthData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.REMEMBER_ME);
    await this.removeItem(STORAGE_KEYS.LAST_ACTIVE);
  }

  static getSessionTimeoutDays(): number {
    return STORAGE_KEYS.SESSION_TIMEOUT_DAYS;
  }
}
