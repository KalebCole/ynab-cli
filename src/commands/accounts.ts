import { Command } from 'commander';
import { client } from '../lib/api-client.js';
import { outputSuccess, outputSuccessWithServerKnowledge } from '../lib/output.js';
import { withErrorHandling } from '../lib/command-utils.js';
import type { CommandOptions } from '../types/index.js';

export function createAccountsCommand(): Command {
  const cmd = new Command('accounts').description('Account operations');

  cmd
    .command('list')
    .description('List all accounts')
    .option('-b, --budget <id>', 'Budget ID')
    .option('--last-knowledge <number>', 'Last knowledge of server', parseInt)
    .action(withErrorHandling(async (options: { budget?: string; lastKnowledge?: number } & CommandOptions) => {
      const result = await client.getAccounts(options.budget, options.lastKnowledge);
      outputSuccessWithServerKnowledge(result?.accounts, result?.server_knowledge);
    }));

  cmd
    .command('view')
    .description('View account details')
    .argument('<id>', 'Account ID')
    .option('-b, --budget <id>', 'Budget ID')
    .action(withErrorHandling(async (id: string, options: CommandOptions) => {
      const account = await client.getAccount(id, options.budget);
      outputSuccess(account);
    }));

  cmd
    .command('transactions')
    .description('List transactions for account')
    .argument('<id>', 'Account ID')
    .option('-b, --budget <id>', 'Budget ID')
    .option('--since <date>', 'Filter transactions since date (YYYY-MM-DD)')
    .option('--type <type>', 'Filter by transaction type')
    .option('--last-knowledge <number>', 'Last knowledge of server', parseInt)
    .action(withErrorHandling(async (
      id: string,
      options: {
        budget?: string;
        since?: string;
        type?: string;
        lastKnowledge?: number;
      } & CommandOptions,
    ) => {
      const result = await client.getTransactionsByAccount(id, {
        budgetId: options.budget,
        sinceDate: options.since,
        type: options.type,
        lastKnowledgeOfServer: options.lastKnowledge,
      });
      outputSuccessWithServerKnowledge(result?.transactions, result?.server_knowledge);
    }));

  return cmd;
}
