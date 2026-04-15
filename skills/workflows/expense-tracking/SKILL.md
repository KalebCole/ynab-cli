# Expense Tracking Workflow

Systematic procedure for tracking and categorizing expenses in YNAB.

## Description
A structured workflow for consistent expense entry, categorization, and reconciliation using the YNAB CLI.

## Workflow Steps

### 1. Import New Transactions
```bash
# Import from financial institutions
ynab transactions import --budget <budget-id>
```

### 2. Review Uncategorized Transactions
```bash
# List uncategorized transactions
ynab transactions list --type uncategorized --fields id,date,amount,payee_name,memo

# Search for similar past transactions
ynab transactions search --payee-name "similar-payee" --fields category_name
```

### 3. Categorize Transactions
```bash
# Update transaction category
ynab transactions update <transaction-id> --category-id <category-id>

# For multiple similar transactions
ynab transactions batch-update --transactions '[
  {"id": "tx1", "category_id": "cat1"},
  {"id": "tx2", "category_id": "cat1"}
]'
```

### 4. Handle Split Transactions
```bash
# Split transaction across multiple categories
ynab transactions split <transaction-id> --splits '[
  {"amount": -15.00, "category_id": "groceries", "memo": "Food items"},
  {"amount": -5.00, "category_id": "household", "memo": "Cleaning supplies"}
]'
```

### 5. Reconcile Accounts
```bash
# List recent transactions for verification
ynab transactions list --account <account-id> --since <last-reconcile-date>

# Check account balance
ynab accounts list --fields id,name,balance
```

### 6. Review and Approve
```bash
# Mark transactions as approved
ynab transactions update <transaction-id> --approved

# Bulk approval
ynab transactions batch-update --transactions '[
  {"id": "tx1", "approved": true},
  {"id": "tx2", "approved": true}
]'
```

## Best Practices

- **Daily Import**: Import transactions daily to stay current
- **Consistent Categorization**: Use search to find similar past transactions
- **Split Complex Purchases**: Use splitting for multi-category expenses
- **Regular Reconciliation**: Match CLI data with bank statements
- **Batch Operations**: Use batch updates for efficiency

## Automation Tips

- Schedule daily imports using cron jobs
- Create shell scripts for common categorization patterns
- Use templates for recurring split transactions
- Build lookup tables for payee-to-category mapping

## Related Skills

- transactions/list: Review imported transactions
- transactions/search: Find categorization examples
- transactions/update: Categorize individual transactions
- transactions/split: Handle multi-category purchases
- accounts/list: Verify balances during reconciliation