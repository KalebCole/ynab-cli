---
name: ynab-accounts
version: 1.0.0
description: YNAB CLI account operations — list, view, transactions by account
metadata:
  requires:
    - ynab-shared
---

# YNAB Accounts

## Commands

### List accounts
```bash
ynab accounts list
ynab accounts list --budget <id>
```

Returns array with `id`, `name`, `type`, `on_budget`, `closed`, `balance`, `cleared_balance`, `uncleared_balance`, `note`.

Account types: `checking`, `savings`, `creditCard`, `cash`, `lineOfCredit`, `otherAsset`, `otherLiability`, `mortgage`, `autoLoan`, `studentLoan`, `personalLoan`, `medicalDebt`, `otherDebt`.

### View account
```bash
ynab accounts view <account-id>
ynab accounts view <account-id> --budget <id>
```

### Account transactions
```bash
ynab accounts transactions <account-id>
ynab accounts transactions <account-id> --since 2026-01-01
ynab accounts transactions <account-id> --fields id,date,amount,payee_name
```

Supports `--since`, `--until`, `--fields`, `--last-knowledge`.

## Agent Patterns

**Find account by name:** `ynab accounts list` → filter by `name`.

**Check balances:**
```bash
ynab accounts list | jq '.[] | {name, balance, type}'
```

**Note:** Accounts are read-only via CLI. Create/close accounts in the YNAB app.
