import keytar from 'keytar';
import { config } from './config.js';

const SERVICE_NAME = 'ynab-cli';
const ACCOUNT_NAME = 'access-token';

export class AuthManager {
  async getAccessToken(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async setAccessToken(token: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
  }

  async deleteAccessToken(): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getAccessToken()) !== null;
  }

  async logout(): Promise<void> {
    await this.deleteAccessToken();
    config.clearDefaultBudget();
  }
}

export const auth = new AuthManager();
