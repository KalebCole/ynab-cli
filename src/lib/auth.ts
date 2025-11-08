import { config } from './config.js';

const SERVICE_NAME = 'ynab-cli';
const ACCOUNT_NAME = 'access-token';

const KEYTAR_UNAVAILABLE_ERROR =
  'Keychain storage unavailable. Cannot store credentials securely.\n' +
  'On Linux, install libsecret: sudo apt-get install libsecret-1-dev\n' +
  'Then reinstall: npm install -g @stephendolan/ynab-cli\n' +
  'Alternatively, use the YNAB_API_KEY environment variable.';

let keytar: typeof import('keytar') | undefined;

try {
  keytar = await import('keytar');
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      'Warning: Keychain storage unavailable. Credentials will not be stored securely.\n' +
        'On Linux, install libsecret: sudo apt-get install libsecret-1-dev\n' +
        'Falling back to environment variable only (YNAB_API_KEY).\n'
    );
  }
}

export class AuthManager {
  async getAccessToken(): Promise<string | null> {
    if (keytar) {
      return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    return null;
  }

  async setAccessToken(token: string): Promise<void> {
    if (keytar) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
    } else {
      throw new Error(KEYTAR_UNAVAILABLE_ERROR);
    }
  }

  async deleteAccessToken(): Promise<boolean> {
    if (keytar) {
      return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    return false;
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
