/**
 * Output formatters for different data formats
 */

export type OutputFormat = 'json' | 'table' | 'csv' | 'yaml';

/**
 * Format data as an ASCII table using console.table
 */
export function formatTable(data: unknown): string {
  if (Array.isArray(data) && data.length > 0) {
    // For arrays, use console.table but capture the output
    const originalLog = console.log;
    let output = '';
    console.log = (message: string) => {
      output += message + '\n';
    };

    try {
      console.table(data);
    } finally {
      console.log = originalLog;
    }

    return output.trim();
  } else if (typeof data === 'object' && data !== null) {
    // For single objects, create a simple key-value table
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return 'No data';

    const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
    const lines = entries.map(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `${paddedKey} │ ${valueStr}`;
    });

    const separator = '─'.repeat(maxKeyLength) + '─┼─' + '─'.repeat(20);
    return [separator, ...lines, separator].join('\n');
  }

  return String(data);
}

/**
 * Format data as CSV with proper escaping
 */
export function formatCsv(data: unknown): string {
  if (data === null || data === undefined) {
    return 'No data';
  }

  // Wrap single objects in an array for uniform processing
  if (!Array.isArray(data)) {
    if (typeof data === 'object') {
      data = [data];
    } else {
      return String(data);
    }
  }

  if ((data as unknown[]).length === 0) {
    return 'No data';
  }

  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    // Simple array, just join with commas
    return data.map(item => escapeCsvValue(String(item))).join(',');
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item as Record<string, unknown>).forEach(key => allKeys.add(key));
    }
  });

  const headers = Array.from(allKeys);
  const headerRow = headers.map(escapeCsvValue).join(',');

  const dataRows = data.map(item => {
    if (typeof item !== 'object' || item === null) return '';
    const obj = item as Record<string, unknown>;
    return headers.map(header => {
      const value = obj[header];
      const valueStr = value === undefined || value === null ? '' :
                      typeof value === 'object' ? JSON.stringify(value) : String(value);
      return escapeCsvValue(valueStr);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV values that contain commas, quotes, or newlines
 */
function escapeCsvValue(value: string): string {
  // Neutralize spreadsheet formula injection
  const formulaPrefixes = ['=', '+', '-', '@', '\t'];
  if (formulaPrefixes.some(ch => value.startsWith(ch))) {
    value = "'" + value;
  }

  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format data as YAML (minimal implementation)
 */
export function formatYaml(data: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (data === null || data === undefined) {
    return 'null';
  }

  if (typeof data === 'string') {
    // Simple string escaping for YAML
    if (data.includes('\n') || data.includes(':') || data.includes('[') || data.includes('{')) {
      return `"${data.replace(/"/g, '\\"')}"`;
    }
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';

    return data.map(item => {
      const formattedItem = formatYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Multi-line object in array
        return `${spaces}- ${formattedItem.replace(/\n/g, `\n${spaces}  `)}`;
      } else {
        // Simple value in array
        return `${spaces}- ${formattedItem}`;
      }
    }).join('\n');
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const entries = Object.entries(obj);

    if (entries.length === 0) return '{}';

    return entries.map(([key, value]) => {
      const formattedValue = formatYaml(value, indent + 1);

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return `${spaces}${key}: []`;
          } else {
            return `${spaces}${key}:\n${formattedValue}`;
          }
        } else {
          // Object value
          return `${spaces}${key}:\n${formattedValue}`;
        }
      } else {
        // Simple value
        return `${spaces}${key}: ${formattedValue}`;
      }
    }).join('\n');
  }

  return String(data);
}