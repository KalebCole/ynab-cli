import { Command } from 'commander';
import { client } from '../lib/api-client.js';
import { outputJson } from '../lib/output.js';
import { YnabCliError } from '../lib/errors.js';
import { withErrorHandling } from '../lib/command-utils.js';
import { validateJson, ApiDataSchema } from '../lib/schemas.js';
import type { CommandOptions } from '../types/index.js';

const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function createApiCommand(): Command {
  const cmd = new Command('api').description('Raw API access');

  cmd
    .argument('<method>', 'HTTP method (GET, POST, PUT, PATCH, DELETE)')
    .argument('<path>', 'API path (e.g., /budgets or /budgets/{budget_id}/transactions)')
    .option('-b, --budget <id>', 'Budget ID (used to replace {budget_id} in path)')
    .option('--data <json>', 'JSON data for POST/PUT/PATCH requests')
    .description('Make raw API calls to YNAB')
    .action(withErrorHandling(async (
      method: string,
      path: string,
      options: { budget?: string; data?: string } & CommandOptions,
    ) => {
      const upperMethod = method.toUpperCase();

      if (!VALID_HTTP_METHODS.includes(upperMethod)) {
        throw new YnabCliError(
          `Invalid HTTP method: ${method}. Must be one of: ${VALID_HTTP_METHODS.join(', ')}`,
          400,
        );
      }

      let data: Record<string, unknown> | undefined;
      if (options.data) {
        try {
          const parsedData = JSON.parse(options.data);
          data = validateJson(parsedData, ApiDataSchema, 'API data');
        } catch (error) {
          throw new YnabCliError('Invalid JSON in --data parameter', 400);
        }
      }

      const result = await client.rawApiCall(upperMethod, path, data, options.budget);
      outputJson(result);
    }));

  return cmd;
}
