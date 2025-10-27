import { Command } from 'commander';
import { client } from '../lib/api-client.js';
import { outputSuccess } from '../lib/output.js';
import { withErrorHandling } from '../lib/command-utils.js';

export function createUserCommand(): Command {
  const cmd = new Command('user').description('User information');

  cmd
    .command('info')
    .description('Get authenticated user information')
    .action(withErrorHandling(async () => {
      const user = await client.getUser();
      outputSuccess(user);
    }));

  return cmd;
}
