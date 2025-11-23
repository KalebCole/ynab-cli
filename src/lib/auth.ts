import { Entry } from '@napi-rs/keyring';
import { config } from './config.js';

const SERVICE_NAME = 'ynab-cli';
const ACCOUNT_NAME = 'access-token';

const KEYRING_UNAVAILABLE_ERROR =
  'Keychain storage unavailable. Cannot store credentials securely.\n' +
  'On Linux, install libsecret: sudo apt-get install libsecret-1-dev\n' +
  'Then reinstall: npm install -g @stephendolan/ynab-cli\n' +
  'Alternatively, use the YNAB_API_KEY environment variable.';

let keyring: Entry | undefined;

try {
  keyring = new Entry(SERVICE_NAME, ACCOUNT_NAME);
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      'Warning: Keychain storage unavailable. Credentials will not be stored securely.\n' +
        'On Linux, install libsecret: sudo apt-get install libsecret-1-dev\n' +
        'On macOS, ensure you have access to the system Keychain.\n' +
        'Falling back to environment variable only (YNAB_API_KEY).\n'
    );
  }
}

export class AuthManager {
  async getAccessToken(): Promise<string | null> {
    if (keyring) {
      try {
        return keyring.getPassword();
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  async setAccessToken(token: string): Promise<void> {
    if (keyring) {
      keyring.setPassword(token);
    } else {
      throw new Error(KEYRING_UNAVAILABLE_ERROR);
    }
  }

  async deleteAccessToken(): Promise<boolean> {
    if (keyring) {
      return keyring.deletePassword();
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
