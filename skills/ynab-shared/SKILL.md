---
name: ynab-shared
version: 1.0.0
description: YNAB CLI shared conventions — auth, global flags, error handling, security
metadata:
  requires: []
---

# YNAB CLI — Shared

## CLI Binary

```bash
ynab <resource> <command> [options]
```

Runtime: Bun. Install: `bun install -g @stephendolan/ynab-cli`

## Authentication

Two methods (checked in order):

1. **OS Keychain** (preferred): `ynab auth login` stores token via `@napi-rs/keyring`
2. **Environment variable**: `YNAB_API_KEY` (warning emitted — visible to other processes)

```bash
ynab auth login     # Interactive token prompt → keychain
ynab auth status    # Check if authenticated
ynab auth logout    # Remove keychain token + clear default budget
```

**Security rules:**
- Never log or output the API token
- Prefer keychain over env var
- Token has full account access — treat as secret

## Global Flags

| Flag | Description |
|------|-------------|
| `-b, --budget <id>` | Budget ID (most commands). Falls back to: default budget → `YNAB_BUDGET_ID` env |
| `-c, --compact` | Minified single-line JSON output |
| `--last-knowledge <n>` | Delta sync — pass previous `server_knowledge` value to get only changes |

## Default Budget

```bash
ynab budgets set-default <id>    # Persist default budget ID
```

Most commands use this automatically. Override with `--budget`.

## Output Format

- All output is JSON to stdout
- Amounts are auto-converted from YNAB milliunits to dollars (divide by 1000)
- Errors are JSON to stdout with `process.exit(1)`
- Stderr used only for warnings (e.g., env var auth warning)

## Error Shape

```json
{
  "error": {
    "name": "not_found",
    "detail": "Resource not found",
    "statusCode": 404
  }
}
```

Common error names: `not_authorized`, `not_found`, `too_many_requests`, `bad_request`, `cli_error`

## Rate Limits

YNAB API: **200 requests per hour** (rolling window). On 429:
- Wait a few minutes and retry
- Use `--last-knowledge` for delta sync to reduce calls
- Use `--fields` to avoid re-fetching full objects

## Amount Handling

- YNAB stores amounts in **milliunits** (e.g., $10.50 = 10500)
- CLI **auto-converts on output** — you see dollars, not milliunits
- CLI **accepts dollars on input** — pass `--amount 10.50`, not `--amount 10500`
- Negative = outflow, positive = inflow

## Confirmation

Delete operations require `--yes` flag: `ynab transactions delete <id> --yes`

## Raw API Escape Hatch

```bash
ynab api GET /budgets
ynab api GET /budgets/{budget_id}/transactions --budget <id>
ynab api POST /budgets/{budget_id}/transactions --budget <id> --data '{"transaction": {...}}'
```

`{budget_id}` is auto-replaced when `--budget` is provided.
