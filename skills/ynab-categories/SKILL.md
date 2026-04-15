---
name: ynab-categories
version: 1.0.0
description: YNAB Categories — View category groups, update category details, budget allocation
metadata:
  requires:
    bins: ["ynab"]
    skills: ["ynab-shared"]
  cliHelp: "ynab categories --help"
---

# YNAB Categories

> **PREREQUISITE:** Read `../ynab-shared/SKILL.md` for auth, global flags, and security rules.

## Quick Reference

```bash
# View categories
ynab categories list [--budget <id>]
ynab categories view <category_id> [--budget <id>]

# Budget allocation
ynab categories budget <category_id> --month 2024-04-01 --amount 500.00

# Update category details  
ynab categories update <category_id> --name "New Name" --note "Updated note"

# Category transactions
ynab categories transactions <category_id> [--since <date>]
```

## Core Commands

### Read Operations
- `list` — All category groups and categories with current balances
- `view` — Single category details including activity and available amounts
- `transactions` — All transactions in a specific category

### Write Operations  
- `update` — Modify category name or note (budget amounts use `budget` command)
- `budget` — Set budgeted amount for a category in a specific month

## Category Structure

YNAB organizes categories in a hierarchy:
```
Category Groups
├── Group 1 (e.g., "Monthly Bills")
│   ├── Category A (e.g., "Rent")
│   ├── Category B (e.g., "Utilities") 
│   └── Category C (e.g., "Phone")
└── Group 2 (e.g., "Everyday Expenses")
    ├── Category D (e.g., "Groceries")
    └── Category E (e.g., "Gas")
```

**Note:** YNAB API does not support creating categories or category groups — use the web/mobile app.

## Budget Allocation

### Setting Monthly Budgets
```bash
# Budget $500 for groceries in April 2024
ynab categories budget <category_id> --month 2024-04-01 --amount 500.00

# View current budget vs activity
ynab categories view <category_id>
```

### Key Budget Fields
- `budgeted` — Amount allocated this month
- `activity` — Actual spending this month (negative = outflow)
- `balance` — Remaining available (budgeted + activity)
- `goal_target` — Category goal amount (if set)

## Filtering & Analysis

### List Options
```bash
# Get category IDs and current balances
ynab categories list --fields id,name,balance,budgeted,activity

# Delta sync for efficiency
ynab categories list --last-knowledge <previous_server_knowledge>
```

### Category Transactions
```bash
# All transactions in category
ynab categories transactions <category_id>

# Recent transactions only
ynab categories transactions <category_id> --since "30 days ago"

# Combine with transaction filters
ynab categories transactions <category_id> --min-amount 10 --status cleared
```

## Common Workflows

### Budget Review
```bash
# 1. List all categories with current status
ynab categories list

# 2. Check overspent categories (negative balance)
ynab categories list --fields id,name,balance | jq '.[] | select(.balance < 0)'

# 3. Review specific category details
ynab categories view <overspent_category_id>
```

### Monthly Budget Setup
```bash
# Set budgets for recurring categories
ynab categories budget <rent_id> --month 2024-05-01 --amount 1200.00
ynab categories budget <groceries_id> --month 2024-05-01 --amount 400.00
ynab categories budget <gas_id> --month 2024-05-01 --amount 150.00
```

### Category Analysis
```bash
# Compare budget vs actual for a category
ynab categories view <category_id>

# See all spending in category this month
ynab categories transactions <category_id> --since "1 month ago"

# Find large transactions in category
ynab categories transactions <category_id> --min-amount 100
```

## Integration Points

### With Transactions
```bash
# Move transactions to different category
ynab transactions list --category <old_category> --fields id
ynab transactions batch-update --transactions '[{"id": "tx1", "category_id": "<new_category>"}]'
```

### With Monthly Reports
```bash
# Get category data for budget analysis
ynab months view 2024-04-01 | jq '.categories[] | select(.balance < 0)'
```

## Limitations

**YNAB API Restrictions:**
- Cannot create new categories (use YNAB web/mobile app)
- Cannot create new category groups (use YNAB web/mobile app)  
- Cannot delete categories (use YNAB web/mobile app)
- Cannot reorder categories (use YNAB web/mobile app)

**Available Operations:**
- ✅ Update category name and note
- ✅ Set budgeted amounts
- ✅ View category balances and activity
- ✅ List transactions by category

## Amount Handling

All amounts are in dollar format:
- `budgeted` — Positive amount allocated to category
- `activity` — Negative for spending, positive for income/returns
- `balance` — Available amount (can be negative if overspent)

## Security Notes

- Budget changes are immediate — no confirmation required
- Use `--dry-run` (when available) to preview budget changes
- Category updates affect budget calculations immediately