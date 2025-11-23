import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthManager } from './auth.js';
import { config } from './config.js';

describe('AuthManager', () => {
  let auth: AuthManager;
  const testToken = 'test-token-abc123';
  const updatedToken = 'test-token-xyz789';

  beforeEach(() => {
    auth = new AuthManager();
  });

  afterEach(async () => {
    await auth.deleteAccessToken();
    config.clearDefaultBudget();
  });

  describe('token management', () => {
    it('should store and retrieve access token', async () => {
      await auth.setAccessToken(testToken);
      const retrieved = await auth.getAccessToken();
      expect(retrieved).toBe(testToken);
    });

    it('should return null when no token stored', async () => {
      const token = await auth.getAccessToken();
      expect(token).toBe(null);
    });

    it('should update existing token', async () => {
      await auth.setAccessToken(testToken);
      await auth.setAccessToken(updatedToken);

      const retrieved = await auth.getAccessToken();
      expect(retrieved).toBe(updatedToken);
    });

    it('should delete token and return true', async () => {
      await auth.setAccessToken(testToken);
      const result = await auth.deleteAccessToken();
      expect(result).toBe(true);

      const token = await auth.getAccessToken();
      expect(token).toBe(null);
    });

    it('should return false when deleting non-existent token', async () => {
      const result = await auth.deleteAccessToken();
      expect(result).toBe(false);
    });
  });

  describe('authentication status', () => {
    it('should return true when authenticated', async () => {
      await auth.setAccessToken(testToken);
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should return false after token deletion', async () => {
      await auth.setAccessToken(testToken);
      await auth.deleteAccessToken();

      const isAuth = await auth.isAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token and clear default budget', async () => {
      await auth.setAccessToken(testToken);
      config.setDefaultBudget('test-budget-id');

      await auth.logout();

      const token = await auth.getAccessToken();
      expect(token).toBe(null);
      expect(config.getDefaultBudget()).toBeUndefined();
    });
  });
});
