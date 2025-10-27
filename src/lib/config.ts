import Conf from 'conf';
import type { Config } from '../types/index.js';

class ConfigManager {
  private conf: Conf<Config>;

  constructor() {
    this.conf = new Conf<Config>({
      projectName: 'ynab-cli',
      schema: {
        defaultBudget: { type: 'string' },
        version: { type: 'string', default: '1.0.0' },
      } as any,
      defaults: { version: '1.0.0' },
    });
  }

  getDefaultBudget(): string | undefined {
    return this.conf.get('defaultBudget');
  }

  setDefaultBudget(budgetId: string): void {
    this.conf.set('defaultBudget', budgetId);
  }

  clearDefaultBudget(): void {
    this.conf.delete('defaultBudget');
  }

  clear(): void {
    this.conf.clear();
  }
}

export const config = new ConfigManager();
