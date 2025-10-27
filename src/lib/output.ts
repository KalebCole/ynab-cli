import fs from 'fs';
import type { OutputOptions } from '../types/index.js';

let globalOutputOptions: OutputOptions = {};

export function setOutputOptions(options: OutputOptions): void {
  globalOutputOptions = options;
}

export function outputJson(data: any, options: OutputOptions = {}): void {
  const mergedOptions = { ...globalOutputOptions, ...options };
  const jsonString = mergedOptions.compact
    ? JSON.stringify(data)
    : JSON.stringify(data, null, 2);

  if (mergedOptions.output) {
    fs.writeFileSync(mergedOptions.output, jsonString);
  } else {
    console.log(jsonString);
  }
}

export function outputSuccess(data: any, options: OutputOptions = {}): void {
  outputJson(data, options);
}

export function outputSuccessWithServerKnowledge(
  data: any,
  _serverKnowledge?: number,
  options: OutputOptions = {},
): void {
  outputJson(data, options);
}
