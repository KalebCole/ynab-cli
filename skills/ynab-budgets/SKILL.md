---
name: ynab-budgets
version: 1.0.0
description: YNAB CLI budget operations — list, view, settings, set-default
metadata:
  requires:
    - ynab-shared
---

# YNAB Budgets

## Commands

### List all budgets
```bash
ynab budgets list
ynab budgets list --include-accounts    # Include account details
```

Returns array of budget objects with `id`, `name`, `last_modified_on`, `first_month`, `last_month`, `currency_format`.

### View budget details
```bash
ynab budgets view                # Uses default budget
ynab budgets view <budget-id>    # Specific budget
```

Returns full budget object including accounts, categories, payees, months, transactions.

**⚠️ Large response** — this returns the entire budget. Use resource-specific commands for targeted queries.

### Budget settings
```bash
ynab budgets settings              # Default budget
ynab budgets settings <budget-id>
```

Returns `date_format` and `currency_format`.

### Set default budget
```bash
ynab budgets set-default <budget-id>
```

Persists locally. All subsequent commands use this budget unless `--budget` overrides.

## Agent Patterns

**First-time setup:**
```bash
ynab budgets list                          # Find budget ID
ynab budgets set-default <id>              # Set as default
```

**Get budget ID by name:** List budgets, filter by `name` field.
