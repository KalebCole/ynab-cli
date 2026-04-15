---
name: ynab-payees
version: 1.0.0
description: YNAB Payees — View payee details, update payee info, manage payee locations
metadata:
  requires:
    bins: ["ynab"]
    skills: ["ynab-shared"]
  cliHelp: "ynab payees --help"
---

# YNAB Payees

> **PREREQUISITE:** Read `../ynab-shared/SKILL.md` for auth, global flags, and security rules.

## Quick Reference

```bash
# View payees
ynab payees list [--budget <id>]
ynab payees view <payee_id> [--budget <id>]

# Update payee
ynab payees update <payee_id> --name "New Payee Name"

# Payee locations (for mobile GPS matching)
ynab payees locations <payee_id>

# Payee transactions
ynab payees transactions <payee_id> [--since <date>]
```

## Core Commands

### Read Operations
- `list` — All payees in budget with transaction counts
- `view` — Single payee details  
- `locations` — Geographic locations associated with payee (for mobile import)
- `transactions` — All transactions for a specific payee

### Write Operations
- `update` — Modify payee name (limited API support)

## Payee Types

YNAB has several types of payees:

### Regular Payees
- Merchants, people, services you pay
- Created automatically when entering transactions
- Can be updated via API

### Special Payees (Read-Only)
- **Transfer accounts** — Other budget accounts (for transfers)
- **Starting Balance** — Initial account balance payee  
- **Manual Balance Adjustment** — Reconciliation adjustments

## Common Usage Patterns

### Payee Analysis
```bash
# Find most frequent payees
ynab payees list --fields id,name | head -10

# See all spending at specific payee
ynab payees transactions <payee_id> --since "6 months ago"

# Find large payments to payee
ynab payees transactions <payee_id> --min-amount 100
```

### Payee Cleanup
```bash
# List all payees to find duplicates
ynab payees list --fields id,name

# Update payee name to consolidate
ynab payees update <payee_id> --name "Standardized Name"

# Move transactions from old payee to new
ynab transactions list --payee <old_payee_id> --fields id
ynab transactions batch-update --data '[{"id": "tx1", "payee_id": "<new_payee_id>"}]'
```

### Transaction Categorization by Payee
```bash
# Find uncategorized transactions for a payee
ynab payees transactions <payee_id> | jq '.[] | select(.category_name == "Uncategorized")'

# Batch categorize all transactions for a payee
ynab payees transactions <payee_id> --fields id | \
  jq -r '.[] | .id' | \
  xargs -I {} ynab transactions update {} --category-id <category_id>
```

## Integration with Transactions

### Finding Payee IDs
```bash
# Search for payee by name pattern
ynab payees list | jq '.[] | select(.name | contains("Coffee"))'

# Get payee ID for transaction updates
ynab payees list --fields id,name | grep -i "amazon"
```

### Payee-Based Transaction Analysis
```bash
# Monthly spending by payee
ynab payees transactions <payee_id> --since "1 month ago" | \
  jq '[.[] | .amount] | add'

# Categorize all transactions for a payee
payee_id="<payee_id>"
category_id="<category_id>"
ynab payees transactions $payee_id --fields id | \
  jq -r '.[] | .id' | \
  while read tx_id; do
    ynab transactions update $tx_id --category-id $category_id
  done
```

## Payee Locations

Some payees have geographic locations for mobile matching:

```bash
# View locations for GPS-based transaction import
ynab payees locations <payee_id>
```

This shows coordinate data used by YNAB mobile apps to automatically assign payees based on GPS location.

## Filtering & Search

### List Filtering
```bash
# Get payee details with transaction counts
ynab payees list --fields id,name

# Delta sync for efficient updates
ynab payees list --last-knowledge <previous_server_knowledge>
```

### Transaction Filtering by Payee
```bash
# All transactions for payee in date range
ynab payees transactions <payee_id> --since 2024-01-01 --until 2024-03-31

# Cleared transactions only
ynab payees transactions <payee_id> --status cleared

# Large transactions only
ynab payees transactions <payee_id> --min-amount 50
```

## Limitations

**YNAB API Restrictions:**
- Cannot create new payees via API (created automatically with transactions)
- Cannot delete payees via API (use YNAB web/mobile app)
- Limited update capabilities (name only)
- Cannot merge payees directly (move transactions, then rename)

**Available Operations:**
- ✅ List all payees
- ✅ View payee details  
- ✅ Update payee name
- ✅ View payee locations
- ✅ List transactions by payee
- ❌ Create payees (auto-created with transactions)
- ❌ Delete payees  
- ❌ Merge payees (manual process)

## Common Workflows

### Payee Consolidation
1. Identify duplicate payees: `ynab payees list | grep -i "target"`
2. Choose canonical name
3. Move transactions: Use transaction batch-update to change payee_id
4. Rename or leave old payee (it will become inactive)

### Expense Analysis by Merchant
1. Find payee ID: `ynab payees list | grep -i "merchant"`
2. Get all transactions: `ynab payees transactions <id>`  
3. Analyze spending patterns, frequency, categories

### Auto-Categorization Setup
1. Identify consistent payees: `ynab payees list`
2. Check their transaction patterns: `ynab payees transactions <id>`
3. Set up rules (external tool) or batch update existing transactions