---
name: ynab-months
version: 1.0.0
description: YNAB Monthly Budgets — View month-by-month budget data and spending analysis
metadata:
  requires:
    bins: ["ynab"]
    skills: ["ynab-shared"]
  cliHelp: "ynab months --help"
---

# YNAB Monthly Budgets

> **PREREQUISITE:** Read `../ynab-shared/SKILL.md` for auth, global flags, and security rules.

## Quick Reference

```bash
# List all months in budget
ynab months list [--budget <id>]

# View specific month details
ynab months view 2024-04-01 [--budget <id>]
ynab months view 2024-04-01 [--budget <id>]
ynab months view 2024-03-01 [--budget <id>]
```

## Core Commands

### Read Operations
- `list` — All months with high-level budget summary
- `view` — Detailed month view with category-by-category breakdown

## Month Data Structure

Each month contains:
- **Month summary** — Total budgeted, activity, available amounts
- **Category details** — Per-category budgeted vs actual for the month
- **Income vs expense** totals
- **Age of money** calculation

## Monthly Budget Analysis

### Current Month Status
```bash
# Quick overview of current month
ynab months view 2024-04-01

# Focus on specific fields
ynab months view 2024-04-01 --fields month,income,budgeted,activity,to_be_budgeted
```

### Historical Analysis
```bash
# List all months to see patterns
ynab months list

# Compare specific months  
ynab months view 2024-03-01
ynab months view 2024-04-01
```

### Budget vs Actual Tracking
```bash
# View month with category breakdown
ynab months view 2024-04-01 | jq '.categories[] | {name, budgeted, activity, balance}'

# Find overspent categories
ynab months view 2024-04-01 | jq '.categories[] | select(.balance < 0)'

# Find unbudgeted categories with activity
ynab months view 2024-04-01 | jq '.categories[] | select(.budgeted == 0 and .activity != 0)'
```

## Key Monthly Metrics

### Budget Summary Fields
- `month` — Month in YYYY-MM-DD format (always first day of month)
- `income` — Total income assigned this month
- `budgeted` — Total amount allocated to categories
- `activity` — Total actual spending/income
- `to_be_budgeted` — Remaining unassigned money
- `age_of_money` — Average age of money spent (in days)

### Category-Level Fields
- `name` — Category name
- `budgeted` — Amount allocated to this category this month  
- `activity` — Actual spending in this category (negative = outflow)
- `balance` — Available amount (budgeted + activity + previous balance)
- `goal_target` — Category goal amount (if set)
- `goal_percentage_complete` — Progress toward goal

## Common Analysis Patterns

### Monthly Budget Health Check
```bash
# 1. Check current month status
ynab months view 2024-04-01

# 2. Identify problem areas
ynab months view 2024-04-01 | jq '.categories[] | select(.balance < 0) | {name, balance}'

# 3. Check unassigned money
ynab months view 2024-04-01 | jq '.to_be_budgeted'
```

### Spending Trend Analysis
```bash
# Compare last 3 months total spending
for month in 2024-02-01 2024-03-01 2024-04-01; do
  echo "=== $month ==="
  ynab months view $month | jq '{month, total_activity: .activity}'
done

# Category spending trends
category_name="Groceries"
for month in 2024-02-01 2024-03-01 2024-04-01; do
  ynab months view $month | jq ".categories[] | select(.name == \"$category_name\") | {month: \"$month\", budgeted, activity}"
done
```

### Budget vs Reality Gap Analysis
```bash
# Find categories consistently over/under budget
ynab months view 2024-04-01 | jq '.categories[] | {
  name,
  budgeted, 
  activity,
  variance: (.activity - .budgeted),
  percent_over: ((.activity / .budgeted) * 100 - 100)
} | select(.budgeted > 0)'
```

## Integration with Other Commands

### Cross-Reference with Transactions
```bash
# Monthly overview first
ynab months view 2024-04-01

# Then drill into specific category
category_id="<from_month_view>"
ynab categories transactions $category_id --since 2024-04-01 --until 2024-04-30
```

### Budget Planning
```bash
# Review last month to plan current
ynab months view 2024-03-01 | jq '.categories[] | {name, budgeted, activity, balance}'

# Set budgets for current month based on patterns
ynab categories budget <category_id> --month 2024-04-01 --amount 500.00
```

## Time Period Helpers

The `view` command requires a concrete date (first day of month, YYYY-MM-DD format). Aliases like `current` or `previous` are **not supported**.

```bash
ynab months view 2024-04-01        # Current calendar month
ynab months view 2024-04-01     # Specific month (always use 1st day)
```

## Delta Sync Support

For efficiency with large budgets:

```bash
# First call - get full data + server knowledge
ynab months list --last-knowledge 0

# Subsequent calls - only changes since last fetch  
ynab months list --last-knowledge <previous_server_knowledge>
```

## Reporting Workflows

### Monthly Budget Report
```bash
#!/bin/bash
month=${1:-2024-04-01}

echo "=== YNAB Monthly Budget Report: $month ==="
echo

# Overall summary
echo "## Summary"
ynab months view $month | jq -r '
  "Income: $" + (.income/1000 | tostring) + 
  "\nBudgeted: $" + (.budgeted/1000 | tostring) +
  "\nActivity: $" + (.activity/1000 | tostring) +  
  "\nTo Budget: $" + (.to_be_budgeted/1000 | tostring)
'

echo
echo "## Overspent Categories"
ynab months view $month | jq -r '
  .categories[] | select(.balance < 0) | 
  .name + ": -$" + ((.balance * -1)/1000 | tostring)
'

echo  
echo "## Unused Budget"
ynab months view $month | jq -r '
  .categories[] | select(.balance > (.budgeted * 0.8) and .budgeted > 0) |
  .name + ": $" + (.balance/1000 | tostring) + " remaining of $" + (.budgeted/1000 | tostring)
'
```

### Category Performance Analysis
```bash
# Compare category performance across months
category="Groceries"
echo "=== $category Performance ==="

for month in 2024-01-01 2024-02-01 2024-03-01 2024-04-01; do
  result=$(ynab months view $month | jq -r "
    .categories[] | select(.name == \"$category\") | 
    \"$month: Budgeted \(.budgeted/1000), Spent \((.activity * -1)/1000), Remaining \(.balance/1000)\"
  ")
  echo "$result"
done
```