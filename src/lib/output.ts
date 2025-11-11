import type { OutputOptions } from '../types/index.js';
import { convertMilliunitsToAmounts } from './utils.js';

let globalOutputOptions: OutputOptions = {};

export function setOutputOptions(options: OutputOptions): void {
  globalOutputOptions = options;
}

export function outputJson(data: unknown, options: OutputOptions = {}): void {
  const convertedData = convertMilliunitsToAmounts(data);
  const mergedOptions = { ...globalOutputOptions, ...options };
  const jsonString = mergedOptions.compact
    ? JSON.stringify(convertedData)
    : JSON.stringify(convertedData, null, 2);

  console.log(jsonString);
}
