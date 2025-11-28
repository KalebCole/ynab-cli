import inquirer from 'inquirer';
import { amountToMilliunits } from './utils.js';

export async function promptForAccessToken(): Promise<string> {
  const { token } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Enter your YNAB Personal Access Token:',
      validate: (input: string) => !!input.trim() || 'Access token is required',
    },
  ]);
  return token.trim();
}

export async function promptForBudget(
  budgets: Array<{ id: string; name: string }>,
): Promise<string> {
  const { budgetId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'budgetId',
      message: 'Select a budget:',
      choices: budgets.map((b) => ({ name: b.name, value: b.id })),
    },
  ]);
  return budgetId;
}

export async function promptForConfirmation(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: false,
    },
  ]);
  return confirmed;
}

export async function promptForTransaction(): Promise<Record<string, unknown>> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'date',
      message: 'Date (YYYY-MM-DD):',
      default: new Date().toISOString().split('T')[0],
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Amount (in currency units, e.g., 10.50):',
      validate: (input: string) => !isNaN(parseFloat(input)) || 'Amount must be a valid number',
    },
    {
      type: 'input',
      name: 'payee_name',
      message: 'Payee name (optional):',
    },
    {
      type: 'input',
      name: 'memo',
      message: 'Memo (optional):',
    },
  ]);

  return {
    date: answers.date,
    amount: amountToMilliunits(parseFloat(answers.amount)),
    payee_name: answers.payee_name || undefined,
    memo: answers.memo || undefined,
  };
}
