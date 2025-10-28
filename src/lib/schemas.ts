import { z } from 'zod';
import { YnabCliError } from './errors.js';

export const TransactionSplitSchema = z.array(
  z.object({
    amount: z.number(),
    category_id: z.string().nullable().optional(),
    memo: z.string().optional(),
    payee_id: z.string().optional(),
  })
);

export const ApiDataSchema = z.record(z.any());

export function validateJson<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fieldName: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new YnabCliError(`Invalid ${fieldName}: ${issues}`, 400);
    }
    throw error;
  }
}
