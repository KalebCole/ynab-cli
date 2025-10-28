import type { OutputOptions } from '../types/index.js';
import { convertMilliunitsToAmounts } from './utils.js';

let globalOutputOptions: OutputOptions = {};

export function setOutputOptions(options: OutputOptions): void {
  globalOutputOptions = options;
}

export function outputJson(data: any, options: OutputOptions = {}): void {
  const convertedData = convertMilliunitsToAmounts(data);

  const mergedOptions = { ...globalOutputOptions, ...options };
  const jsonString = mergedOptions.compact
    ? JSON.stringify(convertedData)
    : JSON.stringify(convertedData, null, 2);

  console.log(jsonString);
}

export function outputSuccess(data: any, options: OutputOptions = {}): void {
  outputJson(data, options);
}
