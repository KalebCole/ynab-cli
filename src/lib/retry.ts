/**
 * Retry wrapper with exponential backoff + jitter for 429/5xx errors.
 * YNAB enforces a 200 req/hr rolling rate limit — agents will hit 429 regularly.
 */

export interface RetryOptions {
  /** Max number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Whether retry is enabled (default: true) */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  enabled: true,
};

/** Global flag to disable retry (set by --no-retry) */
let globalRetryEnabled = true;

export function setGlobalRetryEnabled(enabled: boolean): void {
  globalRetryEnabled = enabled;
}

export function isGlobalRetryEnabled(): boolean {
  return globalRetryEnabled;
}

/**
 * Extract HTTP status code from a YNAB SDK or fetch error.
 * Returns undefined if the error doesn't map to a known HTTP status.
 */
function extractStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const err = error as Record<string, unknown>;

  // YNAB SDK errors: { error: { id, name, detail } }
  if (err.error && typeof err.error === 'object') {
    const inner = err.error as Record<string, unknown>;
    const name = inner.name as string | undefined;
    if (name === 'too_many_requests') return 429;
    if (name === 'internal_server_error') return 500;
    if (name === 'service_unavailable') return 503;
  }

  // Direct fetch response status (rawApiCall path)
  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;

  return undefined;
}

/**
 * Extract Retry-After header value in seconds from error, if present.
 */
function extractRetryAfter(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as Record<string, unknown>;
  if (err.headers && typeof err.headers === 'object') {
    const headers = err.headers as Record<string, string>;
    const val = headers['retry-after'] || headers['Retry-After'];
    if (val) {
      const seconds = parseInt(val, 10);
      if (!isNaN(seconds) && seconds > 0) return seconds;
    }
  }
  return undefined;
}

function isRetryable(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return false;
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay(attempt: number, baseDelayMs: number, statusCode: number, retryAfterSeconds: number | undefined): number {
  // For 429 with Retry-After, respect the server's request
  if (statusCode === 429 && retryAfterSeconds !== undefined) {
    return retryAfterSeconds * 1000 + Math.random() * 1000;
  }
  // Exponential backoff: base * 2^attempt + random jitter up to base
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return exponential + jitter;
}

/**
 * Wrap an async function with retry logic.
 * Retries on 429 (rate limit) and 5xx (server error) only.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  const options = { ...DEFAULT_OPTIONS, ...opts };

  if (!options.enabled || !globalRetryEnabled) {
    return fn();
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const statusCode = extractStatusCode(error);

      if (!isRetryable(statusCode) || attempt === options.maxRetries) {
        throw error;
      }

      const retryAfter = extractRetryAfter(error);
      const delayMs = computeDelay(attempt, options.baseDelayMs, statusCode!, retryAfter);
      const delaySec = (delayMs / 1000).toFixed(1);
      const reason = statusCode === 429 ? 'Rate limited' : `Server error (${statusCode})`;

      console.error(
        `⚠️  ${reason}, retrying in ${delaySec}s (attempt ${attempt + 2}/${options.maxRetries + 1})`
      );

      await sleep(delayMs);
    }
  }

  throw lastError;
}
