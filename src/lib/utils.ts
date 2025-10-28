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

export function convertMilliunitsToAmounts(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertMilliunitsToAmounts(item));
  }

  if (typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (isAmountField(key) && typeof value === 'number') {
        converted[key] = milliunitsToAmount(value);
      } else {
        converted[key] = convertMilliunitsToAmounts(value);
      }
    }
    return converted;
  }

  return data;
}

function isAmountField(fieldName: string): boolean {
  const amountFields = [
    'amount',
    'balance',
    'cleared_balance',
    'uncleared_balance',
    'budgeted',
    'activity',
    'available',
    'goal_target',
  ];

  return amountFields.includes(fieldName) || fieldName.endsWith('_amount');
}

export function parseApprovedFilter(value: string): boolean {
  const normalized = value.toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error(`--approved must be 'true' or 'false', got '${value}'`);
  }
  return normalized === 'true';
}

export function parseStatusFilter(value: string): string[] {
  const statuses = value.split(',').map(s => s.trim().toLowerCase());
  const validStatuses = ['cleared', 'uncleared', 'reconciled'];

  for (const status of statuses) {
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  return statuses;
}

export function applyTransactionFilters(transactions: any[], filters: {
  until?: string;
  approved?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}): any[] {
  let filtered = transactions;

  if (filters.until) {
    filtered = filtered.filter(t => t.date <= filters.until!);
  }

  if (filters.approved !== undefined) {
    const approvedValue = parseApprovedFilter(filters.approved);
    filtered = filtered.filter(t => t.approved === approvedValue);
  }

  if (filters.status) {
    const statuses = parseStatusFilter(filters.status);
    filtered = filtered.filter(t => statuses.includes(t.cleared.toLowerCase()));
  }

  if (filters.minAmount !== undefined) {
    const minMilliunits = amountToMilliunits(filters.minAmount);
    filtered = filtered.filter(t => t.amount >= minMilliunits);
  }

  if (filters.maxAmount !== undefined) {
    const maxMilliunits = amountToMilliunits(filters.maxAmount);
    filtered = filtered.filter(t => t.amount <= maxMilliunits);
  }

  return filtered;
}

export function applyFieldSelection(items: any[], fields?: string): any[] {
  if (!fields) return items;

  const fieldList = fields.split(',').map(f => f.trim());
  return items.map(item => {
    const filtered: any = {};
    fieldList.forEach(field => {
      if (field in item) {
        filtered[field] = item[field];
      }
    });
    return filtered;
  });
}
