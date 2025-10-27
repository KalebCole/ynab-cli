import { Command } from 'commander';
import { client } from '../lib/api-client.js';
import { outputSuccess, outputSuccessWithServerKnowledge } from '../lib/output.js';
import { YnabCliError } from '../lib/errors.js';
import { promptForTransaction } from '../lib/prompts.js';
import { isInteractive, amountToMilliunits } from '../lib/utils.js';
import { withErrorHandling, confirmDelete, buildUpdateObject } from '../lib/command-utils.js';
import type { CommandOptions } from '../types/index.js';
import fs from 'fs';

interface TransactionOptions {
  account?: string;
  date?: string;
  amount?: number;
  payeeName?: string;
  payeeId?: string;
  categoryId?: string;
  memo?: string;
  cleared?: string;
  approved?: boolean;
}

function buildTransactionData(options: TransactionOptions): any {
  if (!options.account) {
    throw new YnabCliError('--account is required in non-interactive mode', 400);
  }
  if (options.amount === undefined) {
    throw new YnabCliError('--amount is required in non-interactive mode', 400);
  }

  return {
    account_id: options.account,
    date: options.date || new Date().toISOString().split('T')[0],
    amount: amountToMilliunits(options.amount),
    payee_name: options.payeeName,
    payee_id: options.payeeId,
    category_id: options.categoryId,
    memo: options.memo,
    cleared: options.cleared,
    approved: options.approved,
  };
}

export function createTransactionsCommand(): Command {
  const cmd = new Command('transactions').description('Transaction operations');

  cmd
    .command('list')
    .description('List transactions')
    .option('-b, --budget <id>', 'Budget ID')
    .option('--account <id>', 'Filter by account ID')
    .option('--category <id>', 'Filter by category ID')
    .option('--payee <id>', 'Filter by payee ID')
    .option('--month <month>', 'Filter by month (YYYY-MM)')
    .option('--since <date>', 'Filter transactions since date (YYYY-MM-DD)')
    .option('--type <type>', 'Filter by transaction type')
    .option('--last-knowledge <number>', 'Last knowledge of server', parseInt)
    .action(withErrorHandling(async (options: {
      budget?: string;
      account?: string;
      category?: string;
      payee?: string;
      month?: string;
      since?: string;
      type?: string;
      lastKnowledge?: number;
    } & CommandOptions) => {
      const params = {
        budgetId: options.budget,
        sinceDate: options.since,
        type: options.type,
        lastKnowledgeOfServer: options.lastKnowledge,
      };

      const result = options.account
        ? await client.getTransactionsByAccount(options.account, params)
        : options.category
        ? await client.getTransactionsByCategory(options.category, params)
        : options.payee
        ? await client.getTransactionsByPayee(options.payee, params)
        : await client.getTransactions(params);

      let transactions: any = result?.transactions || [];

      if (options.month) {
        transactions = transactions.filter((t: any) => t.date.startsWith(options.month!));
      }

      outputSuccessWithServerKnowledge(transactions, result?.server_knowledge);
    }));

  cmd
    .command('view')
    .description('View single transaction')
    .argument('<id>', 'Transaction ID')
    .option('-b, --budget <id>', 'Budget ID')
    .action(withErrorHandling(async (id: string, options: CommandOptions) => {
      const transaction = await client.getTransaction(id, options.budget);
      outputSuccess(transaction);
    }));

  cmd
    .command('create')
    .description('Create transaction')
    .option('-b, --budget <id>', 'Budget ID')
    .option('--account <id>', 'Account ID')
    .option('--date <date>', 'Date (YYYY-MM-DD)')
    .option('--amount <amount>', 'Amount in currency units (e.g., 10.50)', parseFloat)
    .option('--payee-name <name>', 'Payee name')
    .option('--payee-id <id>', 'Payee ID')
    .option('--category-id <id>', 'Category ID')
    .option('--memo <memo>', 'Memo')
    .option('--cleared <status>', 'Cleared status (cleared, uncleared, reconciled)')
    .option('--approved', 'Mark as approved')
    .option('--batch <file>', 'Create multiple transactions from JSON file')
    .action(withErrorHandling(async (options: {
      budget?: string;
      account?: string;
      date?: string;
      amount?: number;
      payeeName?: string;
      payeeId?: string;
      categoryId?: string;
      memo?: string;
      cleared?: string;
      approved?: boolean;
      batch?: string;
    } & CommandOptions) => {
      if (options.batch) {
        const fileContent = fs.readFileSync(options.batch, 'utf-8');
        const transactionsData = JSON.parse(fileContent);
        const result = await client.createTransactions(
          { transactions: transactionsData },
          options.budget,
        );
        outputSuccess(result);
        return;
      }

      const shouldPrompt = isInteractive() && !options.account && !options.amount;
      const transactionData = shouldPrompt
        ? await promptForTransaction()
        : buildTransactionData(options);

      const transaction = await client.createTransaction(
        { transaction: transactionData },
        options.budget,
      );
      outputSuccess(transaction);
    }));

  cmd
    .command('update')
    .description('Update transaction')
    .argument('<id>', 'Transaction ID')
    .option('-b, --budget <id>', 'Budget ID')
    .option('--account <id>', 'Account ID')
    .option('--date <date>', 'Date (YYYY-MM-DD)')
    .option('--amount <amount>', 'Amount in currency units', parseFloat)
    .option('--payee-name <name>', 'Payee name')
    .option('--payee-id <id>', 'Payee ID')
    .option('--category-id <id>', 'Category ID')
    .option('--memo <memo>', 'Memo')
    .option('--cleared <status>', 'Cleared status')
    .option('--approved', 'Mark as approved')
    .action(withErrorHandling(async (
      id: string,
      options: TransactionOptions & { budget?: string } & CommandOptions,
    ) => {
      const transactionData = buildUpdateObject(options, {
        account: 'account_id',
        date: 'date',
        payeeName: 'payee_name',
        payeeId: 'payee_id',
        categoryId: 'category_id',
        memo: 'memo',
        cleared: 'cleared',
        approved: 'approved',
      });

      if (options.amount !== undefined) {
        transactionData.amount = amountToMilliunits(options.amount);
      }

      const transaction = await client.updateTransaction(
        id,
        { transaction: transactionData },
        options.budget,
      );
      outputSuccess(transaction);
    }));

  cmd
    .command('delete')
    .description('Delete transaction')
    .argument('<id>', 'Transaction ID')
    .option('-b, --budget <id>', 'Budget ID')
    .option('-y, --yes', 'Skip confirmation')
    .action(withErrorHandling(async (id: string, options: { budget?: string; yes?: boolean } & CommandOptions) => {
      if (!await confirmDelete('transaction', options.yes)) {
        return;
      }

      const transaction = await client.deleteTransaction(id, options.budget);
      outputSuccess({ message: 'Transaction deleted', transaction });
    }));

  cmd
    .command('import')
    .description('Import transactions')
    .option('-b, --budget <id>', 'Budget ID')
    .action(withErrorHandling(async (options: CommandOptions) => {
      const transactionIds = await client.importTransactions(options.budget);
      outputSuccess({ transaction_ids: transactionIds });
    }));

  cmd
    .command('split')
    .description('Split transaction into multiple categories')
    .argument('<id>', 'Transaction ID')
    .requiredOption('--splits <json>', 'JSON array of splits: [{"amount": -21400, "category_id": "xxx", "memo": "..."}]')
    .option('-b, --budget <id>', 'Budget ID')
    .action(withErrorHandling(async (
      id: string,
      options: { splits: string; budget?: string } & CommandOptions,
    ) => {
      let splits;
      try {
        splits = JSON.parse(options.splits);
      } catch (error) {
        throw new YnabCliError('Invalid JSON in --splits parameter', 400);
      }

      if (!Array.isArray(splits)) {
        throw new YnabCliError('--splits must be a JSON array', 400);
      }

      const transaction = await client.updateTransaction(
        id,
        {
          transaction: {
            category_id: null,
            subtransactions: splits,
          },
        },
        options.budget,
      );
      outputSuccess(transaction);
    }));

  return cmd;
}
