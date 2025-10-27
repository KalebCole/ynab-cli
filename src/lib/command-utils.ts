import { handleYnabError } from './errors.js';
import { promptForConfirmation } from './prompts.js';
import { isInteractive } from './utils.js';
import { outputSuccess } from './output.js';

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      handleYnabError(error);
    }
  };
}

export async function confirmDelete(
  itemType: string,
  skipConfirmation: boolean = false,
): Promise<boolean> {
  if (skipConfirmation || !isInteractive()) {
    return true;
  }

  const confirmed = await promptForConfirmation(
    `Are you sure you want to delete this ${itemType}?`,
  );

  if (!confirmed) {
    outputSuccess({ message: 'Operation cancelled' });
    return false;
  }

  return true;
}

export function buildUpdateObject<T extends Record<string, any>>(
  options: Record<string, any>,
  mapping: Record<string, string>,
): T {
  const result: any = {};

  for (const [optionKey, targetKey] of Object.entries(mapping)) {
    if (options[optionKey] !== undefined) {
      result[targetKey] = options[optionKey];
    }
  }

  return result;
}
