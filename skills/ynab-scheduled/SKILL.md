---
name: ynab-scheduled
version: 1.0.0
description: YNAB Scheduled Transactions — View and manage recurring transaction templates
metadata:
  requires:
    bins: ["ynab"]
    skills: ["ynab-shared"]
  cliHelp: "ynab scheduled --help"
---

# YNAB Scheduled Transactions

> **PREREQUISITE:** Read `../ynab-shared/SKILL.md` for auth, global flags, and security rules.

## Quick Reference

```bash
# View scheduled transactions
ynab scheduled list [--budget <id>]
ynab scheduled view <scheduled_id> [--budget <id>]

# Delete scheduled transaction
ynab scheduled delete <scheduled_id> --yes [--budget <id>]
```

## Core Commands

### Read Operations
- `list` — All scheduled transactions with next occurrence dates
- `view` — Single scheduled transaction details

### Write Operations
- `delete` — Remove scheduled transaction (requires `--yes` confirmation)

## What Are Scheduled Transactions?

Scheduled transactions are recurring transaction templates that YNAB uses to:
- **Predict future cash flow** in budget forecasting
- **Auto-create transactions** on schedule (if enabled)
- **Help with budgeting** for known recurring expenses

They represent things like:
- Monthly rent payments
- Weekly paychecks  
- Quarterly insurance premiums
- Annual subscriptions

## Scheduled Transaction Details

Each scheduled transaction contains:
- `account_id` — Which account the transaction will occur in
- `payee_name` — Who/what you're paying
- `category_id` — Budget category for the transaction  
- `amount` — Transaction amount (negative for expenses, positive for income)
- `memo` — Optional description
- `frequency` — How often it repeats (monthly, weekly, etc.)
- `date_next` — Next occurrence date

## Common Usage

### Review Upcoming Transactions
```bash
# See all scheduled transactions
ynab scheduled list

# Focus on key details
ynab scheduled list --fields payee_name,amount,frequency,date_next

# Find high-value scheduled expenses
ynab scheduled list | jq '.[] | select(.amount < -10000)' # Less than -$100
```

### Budget Planning with Scheduled Items
```bash
# Get monthly recurring expenses for budget planning
ynab scheduled list | jq '.[] | select(.frequency == "monthly" and .amount < 0)'

# Calculate total monthly scheduled expenses
ynab scheduled list | jq '[.[] | select(.frequency == "monthly" and .amount < 0) | .amount] | add / 1000'
```

### Clean Up Old Schedules
```bash
# List scheduled transactions to identify obsolete ones
ynab scheduled list --fields id,payee_name,date_next

# Delete obsolete scheduled transaction
ynab scheduled delete <scheduled_id> --yes
```

## Frequency Types

Common frequency values you'll see:
- `never` — One-time (not actually recurring)
- `daily` — Every day
- `weekly` — Every week  
- `everyOtherWeek` — Bi-weekly
- `twiceAMonth` — Semi-monthly
- `monthly` — Monthly
- `everyOtherMonth` — Bi-monthly
- `everyThreeMonths` — Quarterly
- `everyFourMonths` — Three times per year
- `twiceAYear` — Semi-annually  
- `yearly` — Annually

## Integration with Budget Planning

### Monthly Budget Calculation
```bash
# Calculate guaranteed monthly expenses from scheduled transactions
monthly_scheduled=$(ynab scheduled list | jq '
  [.[] | select(.frequency == "monthly" and .amount < 0) | .amount] | add
')

echo "Monthly scheduled expenses: $$(echo "$monthly_scheduled / 1000" | bc -l)"
```

### Cash Flow Forecasting
```bash
# See what's coming up in next 30 days
today=$(date +%Y-%m-%d)
next_month=$(date -d "+30 days" +%Y-%m-%d)

ynab scheduled list | jq --arg today "$today" --arg next_month "$next_month" '
  .[] | select(.date_next >= $today and .date_next <= $next_month)
'
```

## Limitations

**YNAB API Restrictions:**
- Cannot create scheduled transactions (use YNAB web/mobile app)
- Cannot update scheduled transactions (use YNAB web/mobile app)  
- Can only delete scheduled transactions
- Cannot modify frequency or amounts via API

**Available Operations:**
- ✅ List all scheduled transactions
- ✅ View scheduled transaction details
- ✅ Delete scheduled transactions
- ❌ Create new scheduled transactions
- ❌ Update existing scheduled transactions
- ❌ Modify frequency or occurrence rules

## Delta Sync Support

For efficient updates:
```bash
# First call - full list + server knowledge
ynab scheduled list --last-knowledge 0

# Subsequent calls - only changes
ynab scheduled list --last-knowledge <previous_server_knowledge>
```

## Common Workflows

### Scheduled Transaction Audit
```bash
# 1. List all scheduled transactions
ynab scheduled list

# 2. Check for duplicates or obsolete entries
ynab scheduled list --fields payee_name,amount,frequency | sort

# 3. Remove obsolete ones
ynab scheduled delete <obsolete_id> --yes
```

### Budget Setup from Scheduled Items
```bash
# Extract monthly scheduled expenses for budget allocation
ynab scheduled list | jq -r '
  .[] | select(.frequency == "monthly" and .amount < 0) |
  "Category: \(.category_name // "Unknown") - Amount: $\((.amount * -1) / 1000)"
'
```

### Income Planning
```bash
# Find scheduled income (positive amounts)
ynab scheduled list | jq '.[] | select(.amount > 0)' 

# Calculate expected monthly income
ynab scheduled list | jq '
  [.[] | select(.frequency == "monthly" and .amount > 0) | .amount] | add / 1000
'
```

## Security Notes

- Delete operations require `--yes` flag to prevent accidental removal
- Scheduled transactions don't contain sensitive data beyond what's in regular transactions
- Deletion is immediate and cannot be undone via API

## Troubleshooting

### Missing Scheduled Transactions
If expected scheduled transactions don't appear:
1. Check if they're enabled in YNAB web/mobile
2. Verify budget context with `--budget` flag
3. Some scheduled transactions may have been converted to regular transactions

### Unexpected Scheduled Transactions  
If you see unexpected items:
1. Check the `payee_name` and `memo` fields for context
2. Look at `date_next` to see when it would occur
3. Use YNAB web interface to get full editing capabilities