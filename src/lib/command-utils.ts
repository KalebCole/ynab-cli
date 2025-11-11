import { handleYnabError } from './errors.js';
import { promptForConfirmation } from './prompts.js';
import { isInteractive } from './utils.js';
import { outputJson } from './output.js';

export function withErrorHandling<TArgs extends unknown[], R>(
  fn: (...args: TArgs) => Promise<R>,
): (...args: TArgs) => Promise<void> {
  return async (...args: TArgs) => {
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
    outputJson({ message: 'Operation cancelled' });
    return false;
  }

  return true;
}

export function buildUpdateObject<T>(
  options: T,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const optionsRecord = options as Record<string, unknown>;

  for (const [optionKey, targetKey] of Object.entries(mapping)) {
    if (optionsRecord[optionKey] !== undefined) {
      result[targetKey] = optionsRecord[optionKey];
    }
  }

  return result;
}
