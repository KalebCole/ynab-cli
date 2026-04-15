---
name: ynab-transactions
version: 1.0.0
description: YNAB Transactions — Full CRUD operations, search, batch operations, split handling
metadata:
  requires:
    bins: ["ynab"]
    skills: ["ynab-shared"]
  cliHelp: "ynab transactions --help"
---

# YNAB Transactions

> **PREREQUISITE:** Read `../ynab-shared/SKILL.md` for auth, global flags, and security rules.

## Quick Reference

```bash
# List transactions
ynab transactions list [--budget <id>] [--account <id>] [--since <date>]

# Search & filter
ynab transactions search --memo "coffee" --since "30 days ago"
ynab transactions search --payee-name "Starbucks" --amount 5.50
ynab transactions list --min-amount 50 --max-amount 200
ynab transactions list --status cleared,uncleared

# CRUD operations  
ynab transactions create --account <id> --amount -25.50 --payee-name "Coffee Shop"
ynab transactions view <transaction_id>
ynab transactions update <id> --memo "Updated memo"
ynab transactions delete <id> --yes

# Batch operations
ynab transactions batch-update --transactions '[{"id": "...", "memo": "bulk update"}]'
ynab transactions split <id> --splits '[{"amount": -15, "category_id": "..."}, {...}]'

# Analysis
ynab transactions summary --since 2024-01-01
ynab transactions find-transfers <transaction_id>
```

## Core Commands

### List & Filter
- `list` — All transactions with extensive filtering
- `search` — Text search across payee names, memos, and categories
- `view` — Single transaction details
- `summary` — Aggregate spending analysis by category/payee/month
- `find-transfers` — Detect potential transfer pairs between accounts

### Write Operations
- `create` — New transaction (requires `--account`, `--amount`)
- `update` — Modify existing transaction
- `delete` — Remove transaction (requires `--yes` confirmation)
- `batch-update` — Update multiple transactions in one call
- `split` — Convert single transaction into split transaction

### Special Operations
- `import` — Trigger YNAB's automatic import from linked accounts

## Key Filters & Options

| Flag | Purpose | Example |
|------|---------|---------|
| `--account <id>` | Limit to specific account | Account filter |
| `--category <id>` | Transactions in category | Category filter |
| `--payee <id>` | Transactions with payee | Payee filter |
| `--since <date>` | From date (ISO or relative) | `--since 2024-01-01` or `--since "30 days ago"` |
| `--until <date>` | To date | `--until yesterday` |
| `--min-amount <n>` | Minimum absolute amount | `--min-amount 10.50` |
| `--max-amount <n>` | Maximum absolute amount | `--max-amount 100` |
| `--status <list>` | Cleared status filter | `--status cleared,reconciled` |
| `--approved <bool>` | Approval filter | `--approved true` |
| `--fields <list>` | Field selection | `--fields id,date,amount,memo` |
| `--limit <n>` | Result limit | `--limit 50` |

## Advanced Usage

### Delta Sync
Use `--last-knowledge` for efficient updates:
```bash
# First call - get all + server knowledge
ynab transactions list --last-knowledge 0

# Subsequent - only changes since last knowledge
ynab transactions list --last-knowledge 42
```

### Batch Operations
Update multiple transactions efficiently:
```bash
ynab transactions batch-update --transactions '[
  {"id": "tx1", "memo": "Updated memo 1"},
  {"id": "tx2", "category_id": "new-category"}
]'
```

### Split Transactions
Convert a transaction into multiple categories:
```bash
ynab transactions split <transaction_id> --splits '[
  {"amount": -15.00, "category_id": "cat1", "memo": "Part 1"},
  {"amount": -10.50, "category_id": "cat2", "memo": "Part 2"}
]'
```

## Amount Handling

**Critical:** Amounts use dollar format, not YNAB's milliunits:
- Input: `--amount -25.50` (negative for outflow, positive for inflow)
- Output: Automatically converted to dollars
- Inflow (income) = positive, Outflow (expense) = negative

## Search Capabilities

The `search` command provides fuzzy text matching:
- Searches across: payee names, memos
- Case-insensitive partial matching
- Requires at least one of: `--memo`, `--payee-name`, or `--amount`
- Combine with date filters: `--since` and `--until`

## Security Notes

- `delete` operations require `--yes` flag to prevent accidents
- All API tokens are handled securely via keychain
- Error messages sanitize any leaked credentials

## Common Patterns

### Monthly Expense Report
```bash
ynab transactions list --since "1 month ago" --status cleared | \
  ynab transactions summary --group-by category
```

### Find Uncategorized Transactions
```bash
ynab transactions list --category uncategorized --limit 20
```

### Bulk Categorization
```bash
# Search first
ynab transactions search --payee-name "amazon" --fields id,memo

# Then batch update
ynab transactions batch-update --transactions '[
  {"id": "tx1", "category_id": "shopping-category"}
]'
```

### Transfer Detection
```bash
ynab transactions find-transfers <transaction_id> --days 7
```

## Integration with Other Resources

- Use `ynab accounts list` to get account IDs for filtering
- Use `ynab categories list` to get category IDs for updates
- Use `ynab payees list` to get payee IDs for filtering
- Cross-reference with `ynab months view` for budget vs actual analysis