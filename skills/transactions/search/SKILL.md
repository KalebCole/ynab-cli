# Transaction Search Skill  

Advanced transaction search with flexible criteria.

## Description
Search transactions using memo text, payee names, exact amounts, and other criteria with built-in filtering.

## Usage
```bash
# Search by memo
ynab transactions search --memo "coffee"

# Search by payee name
ynab transactions search --payee-name "amazon"

# Search by exact amount
ynab transactions search --amount 25.50

# Combined search
ynab transactions search --memo "gas" --since 2024-01-01 --status cleared
```

## Parameters
**Search Criteria (at least one required):**
- `--memo <text>`: Search memo field (case-insensitive)
- `--payee-name <name>`: Search payee name (case-insensitive)  
- `--amount <amount>`: Exact amount match in dollars

**Additional Filters:**
- `--budget <id>`: Budget ID
- `--since <date>`: Start date filter
- `--until <date>`: End date filter
- `--approved <true|false>`: Approval status
- `--status <statuses>`: Cleared status
- `--fields <fields>`: Output field selection

## Output
```json
[
  {
    "id": "tx-123",
    "date": "2024-01-15", 
    "amount": -4.50,
    "memo": "Morning coffee",
    "payee_name": "Coffee Shop",
    "category_name": "Food & Dining"
  }
]
```

## Use Cases
- Find specific purchases
- Locate transactions for reconciliation
- Expense categorization cleanup
- Duplicate transaction detection
- Audit trail investigation

## Search Tips
- Use partial text for broader results
- Combine criteria for precise matching
- Include date ranges for better performance
- Use field selection to focus output