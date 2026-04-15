import type { YnabError } from '../types/index.js';
import { outputJson } from './output.js';

/**
 * Granular exit codes for scripting and agent automation.
 *
 * 0 = success
 * 1 = generic / unknown error
 * 2 = authentication error (401)
 * 3 = not found (404)
 * 4 = rate limited (429)
 * 5 = validation error (400 / 422 / Zod)
 * 6 = server error (5xx)
 * 7 = budget not found / config missing
 */
export const ExitCode = {
  SUCCESS: 0,
  GENERIC: 1,
  AUTH: 2,
  NOT_FOUND: 3,
  RATE_LIMITED: 4,
  VALIDATION: 5,
  SERVER: 6,
  CONFIG: 7,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/** Map YNAB API error names to exit codes. */
const ERROR_EXIT_CODES: Record<string, ExitCodeValue> = {
  bad_request: ExitCode.VALIDATION,
  not_authorized: ExitCode.AUTH,
  subscription_lapsed: ExitCode.AUTH,
  trial_expired: ExitCode.AUTH,
  unauthorized_scope: ExitCode.AUTH,
  data_limit_reached: ExitCode.AUTH,
  not_found: ExitCode.NOT_FOUND,
  resource_not_found: ExitCode.NOT_FOUND,
  conflict: ExitCode.VALIDATION,
  too_many_requests: ExitCode.RATE_LIMITED,
  internal_server_error: ExitCode.SERVER,
  service_unavailable: ExitCode.SERVER,
};

/** Map HTTP status codes to exit codes as a secondary lookup. */
const ERROR_STATUS_CODES: Record<string, number> = {
  bad_request: 400,
  not_authorized: 401,
  subscription_lapsed: 403,
  trial_expired: 403,
  unauthorized_scope: 403,
  data_limit_reached: 403,
  not_found: 404,
  resource_not_found: 404,
  conflict: 409,
  too_many_requests: 429,
  internal_server_error: 500,
  service_unavailable: 503,
};

function exitCodeForError(name: string, statusCode?: number): ExitCodeValue {
  if (name in ERROR_EXIT_CODES) return ERROR_EXIT_CODES[name];
  if (statusCode !== undefined) {
    if (statusCode === 401) return ExitCode.AUTH;
    if (statusCode === 404) return ExitCode.NOT_FOUND;
    if (statusCode === 429) return ExitCode.RATE_LIMITED;
    if (statusCode === 400 || statusCode === 422) return ExitCode.VALIDATION;
    if (statusCode >= 500) return ExitCode.SERVER;
  }
  return ExitCode.GENERIC;
}

export class YnabCliError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'YnabCliError';
  }
}

export function sanitizeErrorMessage(message: string): string {
  const sensitivePatterns = [
    /Bearer\s+[\w\-._~+/]+=*/gi,
    /token[=:]\s*[\w\-._~+/]+=*/gi,
    /api[_-]?key[=:]\s*[\w\-._~+/]+=*/gi,
    /authorization:\s*bearer\s+[\w\-._~+/]+=*/gi,
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized.length > 500 ? sanitized.substring(0, 500) + '...' : sanitized;
}

interface YnabApiError {
  name?: string;
  detail?: string;
  message?: string;
  id?: string;
}

function isErrorObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function sanitizeApiError(error: unknown): YnabError {
  if (!isErrorObject(error)) {
    return {
      name: 'api_error',
      detail: 'An error occurred',
      id: undefined,
    };
  }

  const apiError = error as YnabApiError;
  const detail = sanitizeErrorMessage(
    String(apiError.detail || apiError.message || 'An error occurred')
  );

  return {
    name: apiError.name || 'api_error',
    detail,
    id: apiError.id,
  };
}

function enhanceRateLimitMessage(detail: string): string {
  return `${detail}\n\nYNAB API limit: 200 requests/hour (rolling window). Wait a few minutes and retry.`;
}

function formatErrorResponse(name: string, detail: string, statusCode: number): never {
  const enhancedDetail = name === 'too_many_requests' ? enhanceRateLimitMessage(detail) : detail;
  const exitCode = exitCodeForError(name, statusCode);

  outputJson({ error: { name, detail: enhancedDetail, statusCode } });
  process.exit(exitCode);
}

export function handleYnabError(error: unknown): never {
  if (!isErrorObject(error)) {
    formatErrorResponse('unknown_error', 'An unexpected error occurred', 1);
  }

  const errorObj = error as { error?: unknown; message?: string };

  if (errorObj.error) {
    const ynabError: YnabError = sanitizeApiError(errorObj.error);
    formatErrorResponse(
      ynabError.name,
      ynabError.detail,
      ERROR_STATUS_CODES[ynabError.name] || 500
    );
  }

  if (error instanceof YnabCliError) {
    const sanitized = sanitizeErrorMessage(error.message);
    const code = error.statusCode || 1;
    const isBudgetError =
      error.message.toLowerCase().includes('budget') ||
      error.message.toLowerCase().includes('config') ||
      error.message.toLowerCase().includes('no default budget');
    if (isBudgetError) {
      outputJson({ error: { name: 'cli_error', detail: sanitized, statusCode: code } });
      process.exit(ExitCode.CONFIG);
    }
    formatErrorResponse('cli_error', sanitized, code);
  }

  const sanitized = sanitizeErrorMessage(errorObj.message || 'An unexpected error occurred');
  formatErrorResponse('unknown_error', sanitized, 1);
}
