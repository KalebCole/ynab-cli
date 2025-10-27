import type { YnabError } from '../types/index.js';
import { outputJson } from './output.js';

export class YnabCliError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'YnabCliError';
  }
}

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

function formatErrorResponse(name: string, detail: string, statusCode: number): never {
  outputJson({ error: { name, detail, statusCode } });
  process.exit(1);
}

export function handleYnabError(error: any): never {
  if (error.error) {
    const ynabError: YnabError = error.error;
    formatErrorResponse(
      ynabError.name,
      ynabError.detail,
      ERROR_STATUS_CODES[ynabError.name] || 500,
    );
  }

  if (error instanceof YnabCliError) {
    formatErrorResponse('cli_error', error.message, error.statusCode || 1);
  }

  formatErrorResponse('unknown_error', error.message || 'An unexpected error occurred', 1);
}
