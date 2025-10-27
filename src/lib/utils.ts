import { format, parseISO } from 'date-fns';

export function milliunitsToAmount(milliunits: number): number {
  return milliunits / 1000;
}

export function amountToMilliunits(amount: number): number {
  return Math.round(amount * 1000);
}

export function formatCurrency(milliunits: number, currencySymbol = '$'): string {
  const amount = milliunitsToAmount(milliunits);
  return `${currencySymbol}${amount.toFixed(2)}`;
}

export function formatDate(isoDate: string, formatString = 'yyyy-MM-dd'): string {
  return format(parseISO(isoDate), formatString);
}

export function parseDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd');
}

export function isInteractive(): boolean {
  return process.stdin.isTTY === true;
}
