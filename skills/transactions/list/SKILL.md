# Transaction List Skill

List and filter transactions with advanced options.

## Description
Retrieve transactions with comprehensive filtering, field selection, and output formatting.

## Usage
```bash
# Basic listing
ynab transactions list

# With filters
ynab transactions list --since 2024-01-01 --account <id> --min-amount 50

# Field selection
ynab transactions list --fields id,date,amount,memo --limit 10
```

## Parameters
- `--budget <id>`: Budget ID (optional, uses default)
- `--account <id>`: Filter by account ID
- `--category <id>`: Filter by category ID  
- `--payee <id>`: Filter by payee ID
- `--since <date>`: Start date (YYYY-MM-DD)
- `--until <date>`: End date (YYYY-MM-DD)
- `--type <type>`: Transaction type filter
- `--approved <true|false>`: Approval status
- `--status <statuses>`: Cleared status (cleared,uncleared,reconciled)
- `--min-amount <amount>`: Minimum amount in dollars
- `--max-amount <amount>`: Maximum amount in dollars
- `--fields <fields>`: Comma-separated field list
- `--limit <number>`: Maximum results
- `--last-knowledge <number>`: Delta sync parameter

## Output
```json
[
  {
    "id": "transaction-id",
    "date": "2024-01-15",
    "amount": -25.50,
    "memo": "Coffee shop",
    "payee_name": "Local Coffee",
    "category_id": "category-id",
    "account_id": "account-id",
    "cleared": "cleared",
    "approved": true
  }
]
```

## Use Cases
- Daily expense review
- Account reconciliation
- Budget analysis
- Expense reporting
- Data export for external tools

## Performance Notes
- Large datasets may be truncated (pagination coming soon)
- Use `--limit` for better performance
- Field selection reduces output size
- Date ranges improve query efficiency