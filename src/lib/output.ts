import type { OutputOptions } from '../types/index.js';
import { convertMilliunitsToAmounts } from './utils.js';
import { formatTable, formatCsv, formatYaml, type OutputFormat } from './formatters.js';

let globalOutputOptions: OutputOptions = {};

export function setOutputOptions(options: OutputOptions): void {
  globalOutputOptions = options;
}

export function outputJson(data: unknown, options: OutputOptions = {}): void {
  output(data, options);
}

export function output(data: unknown, options: OutputOptions = {}): void {
  const convertedData = convertMilliunitsToAmounts(data);
  const mergedOptions = { ...globalOutputOptions, ...options };
  const format = mergedOptions.format || 'json';

  let outputString: string;

  switch (format) {
    case 'table':
      outputString = formatTable(convertedData);
      break;
    case 'csv':
      outputString = formatCsv(convertedData);
      break;
    case 'yaml':
      outputString = formatYaml(convertedData);
      break;
    case 'json':
      outputString = mergedOptions.compact
        ? JSON.stringify(convertedData)
        : JSON.stringify(convertedData, null, 2);
      break;
    default:
      throw new Error(`Unsupported output format: '${format}'. Supported formats: json, table, csv, yaml`);
  }

  console.log(outputString);
}
