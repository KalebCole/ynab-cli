import { describe, it, expect } from 'vitest';
import { validateJson, TransactionSplitSchema, ApiDataSchema } from './schemas.js';
import { YnabCliError } from './errors.js';

describe('TransactionSplitSchema', () => {
  it('should validate valid transaction splits', () => {
    const validSplits = [
      {
        amount: -21400,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        memo: 'Split 1',
      },
      {
        amount: -10000,
        category_id: null,
        memo: 'Split 2',
      },
    ];

    const result = validateJson(validSplits, TransactionSplitSchema, 'splits');
    expect(result).toEqual(validSplits);
  });

  it('should reject splits with invalid amount type', () => {
    const invalidSplits = [
      {
        amount: 'not-a-number',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    ];

    expect(() => {
      validateJson(invalidSplits, TransactionSplitSchema, 'splits');
    }).toThrow(YnabCliError);
  });

  it('should allow optional fields to be missing', () => {
    const minimalSplits = [
      {
        amount: -5000,
      },
    ];

    const result = validateJson(minimalSplits, TransactionSplitSchema, 'splits');
    expect(result).toEqual(minimalSplits);
  });

  it('should reject non-array input', () => {
    const notAnArray = {
      amount: -5000,
      category_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => {
      validateJson(notAnArray, TransactionSplitSchema, 'splits');
    }).toThrow(YnabCliError);
  });

  it('should handle empty arrays', () => {
    const emptySplits: unknown[] = [];
    const result = validateJson(emptySplits, TransactionSplitSchema, 'splits');
    expect(result).toEqual([]);
  });
});

describe('ApiDataSchema', () => {
  it('should validate valid objects', () => {
    const validData = {
      transaction: {
        date: '2024-01-01',
        amount: -10000,
      },
    };

    const result = validateJson(validData, ApiDataSchema, 'API data');
    expect(result).toEqual(validData);
  });

  it('should accept empty objects', () => {
    const emptyData = {};
    const result = validateJson(emptyData, ApiDataSchema, 'API data');
    expect(result).toEqual({});
  });

  it('should accept nested objects', () => {
    const nestedData = {
      level1: {
        level2: {
          level3: 'value',
        },
      },
    };

    const result = validateJson(nestedData, ApiDataSchema, 'API data');
    expect(result).toEqual(nestedData);
  });

  it('should reject non-object types', () => {
    const notAnObject = 'just a string';

    expect(() => {
      validateJson(notAnObject, ApiDataSchema, 'API data');
    }).toThrow(YnabCliError);
  });

  it('should reject arrays', () => {
    const anArray = [1, 2, 3];

    expect(() => {
      validateJson(anArray, ApiDataSchema, 'API data');
    }).toThrow(YnabCliError);
  });
});

describe('validateJson', () => {
  it('should include field name in error message', () => {
    const invalidData = 'not valid';

    try {
      validateJson(invalidData, ApiDataSchema, 'test field');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(YnabCliError);
      expect((error as YnabCliError).message).toContain('test field');
    }
  });

  it('should include validation details in error message', () => {
    const invalidSplits = [{ amount: 'invalid' }];

    try {
      validateJson(invalidSplits, TransactionSplitSchema, 'splits');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(YnabCliError);
      expect((error as YnabCliError).message).toContain('amount');
    }
  });
});
