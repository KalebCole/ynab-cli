export interface Config {
  defaultBudget?: string;
  version: string;
}

export interface YnabError {
  id?: string;
  name: string;
  detail: string;
}

export interface ApiErrorResponse {
  error: YnabError;
}

export interface OutputOptions {
  compact?: boolean;
  format?: 'json' | 'table' | 'csv' | 'yaml';
}

export interface CommandOptions extends OutputOptions {
  budget?: string;
}
