# ARCHITECTURE-GAPS.md — YNAB CLI Fork

> Generated: 2026-04-14
> Target: stephendolan/ynab-cli v2.8.2 (Bun, Commander.js, YNAB API v1)

---

## Phase 1: Triage Summary

### Tech Stack
- **Runtime:** Bun (not Node.js — uses `bun run`, `bunx`, Bun-native APIs)
- **CLI framework:** Commander.js v14
- **YNAB SDK:** `ynab` v2.10.0 (official JS SDK wrapping YNAB API v1)
- **Auth:** OS keychain via `@napi-rs/keyring` + `YNAB_API_KEY` env fallback
- **Config:** `conf` v15 (stores default budget ID)
- **Validation:** Zod v3
- **MCP:** `@modelcontextprotocol/sdk` v1.12 (MCP server built in)
- **Build:** tsup → ESM output (`dist/cli.js`)

### Command/Resource Map

| Resource | Commands | Write Ops |
|----------|----------|-----------|
| `auth` | login, status, logout | login, logout |
| `user` | info | — |
| `budgets` | list, view, settings, set-default | set-default (local config) |
| `accounts` | list, view, transactions | — |
| `categories` | list, view, update, budget, transactions | update, budget |
| `transactions` | list, view, create, update, delete, import, split, batch-update, search, summary, find-transfers | create, update, delete, split, batch-update, import |
| `payees` | list, view, update, locations, transactions | update |
| `months` | list, view | — |
| `scheduled` | list, view, delete | delete |
| `api` | raw GET/POST/PUT/PATCH/DELETE | any via raw |
| `mcp` | MCP server mode | — |

### Auth Mechanism
1. Keychain lookup via `@napi-rs/keyring` (service: `ynab-cli`, account: `access-token`)
2. Fallback: `YNAB_API_KEY` env var (with security warning)
3. Token passed to `new ynab.API(accessToken)` — SDK handles all HTTP

### Output/Error Patterns
- **Output:** JSON only via `outputJson()`. Milliunits auto-converted to dollars on output. `--compact` flag for minified JSON. No table/csv/yaml.
- **Errors:** `handleYnabError()` → JSON error object to stdout, then `process.exit(1)`. All errors exit 1 regardless of type. Sensitive data redacted from error messages.
- **Confirmation:** Delete operations require `--yes` flag.

### What Exists vs What's Missing

**Exists:**
- Full CRUD for transactions (including split, batch-update, search, summary, find-transfers)
- Read operations for all resources
- Update for categories, payees
- Delta sync support via `--last-knowledge` on list commands
- Field selection via `--fields`
- Client-side filtering (date range, amount range, status, approval)
- Raw API escape hatch (`ynab api GET /path`)
- MCP server
- Milliunit conversion (transparent dollar amounts)
- Zod validation for complex inputs

**Missing:**
1. No retry/backoff on 429 or 5xx (rate limit = 200 req/hr)
2. No `--dry-run` on write commands
3. No output format options (table, csv, yaml)
4. All errors exit code 1 (no granular codes)
5. No agent skill files
6. Auto-pagination not applicable (see below)

---

## Phase 2: Gap Analysis

### Gap 1: Auto-Pagination (server_knowledge delta sync)

**Status: PARTIALLY EXISTS — Design refinement needed**

The YNAB API does **not** use traditional cursor/page-token pagination. Instead it uses `server_knowledge` for delta sync:
- First call: omit `lastKnowledgeOfServer` → get full dataset + `server_knowledge` number
- Subsequent calls: pass `lastKnowledgeOfServer=N` → get only changes since N

**What exists:**
- `--last-knowledge` flag on `transactions list`, `categories list`, `payees list`, `months list`, `scheduled list`, `accounts list`
- `server_knowledge` returned in response when flag is used

**What's missing:**
- **Local knowledge store:** No persistence of `server_knowledge` per resource per budget. Agents must manually track it.
- **Auto-delta mode:** A `--delta` flag that auto-reads last stored knowledge, fetches delta, updates stored knowledge, and returns only changes.

**Where:** New file `src/lib/knowledge-store.ts` using `conf` (already a dependency). Modify list commands in each `src/commands/*.ts` to support `--delta`.

**New behavior:**
```bash
# First call — full fetch, stores server_knowledge locally
ynab transactions list --delta

# Subsequent calls — only returns changes since last fetch
ynab transactions list --delta
# Output includes: { transactions: [...changes...], server_knowledge: 42, is_delta: true }
```

**Complexity:** Medium. Touch all list commands + new knowledge store module.

---

### Gap 2: Retry on 429/5xx

**What's missing:** Zero retry logic. A 429 (rate limit: 200 req/hr rolling) or 5xx immediately exits with error JSON.

**Where:** `src/lib/api-client.ts` — the `YnabClient` class. Two paths need wrapping:
1. **SDK calls** (most commands): The `ynab` SDK uses `fetch` internally. We need to wrap each SDK method call with retry logic, or monkey-patch the SDK's fetch.
2. **Raw API calls** (`rawApiCall` method): Direct `fetch` — easy to wrap.

**Recommended approach:** Create `src/lib/retry.ts` with a generic `withRetry<T>(fn: () => Promise<T>, opts)` wrapper. Apply it in `getApi()` by wrapping the SDK's internal fetch, or wrap each public method in `YnabClient`.

**New behavior:**
- On 429: Wait `Retry-After` header seconds (or 60s default), retry up to 3 times
- On 5xx: Exponential backoff with jitter (1s, 2s+jitter, 4s+jitter), retry up to 3 times
- On retry, emit warning to stderr: `⚠️ Rate limited, retrying in 60s (attempt 2/3)`
- `--no-retry` flag to disable

**Complexity:** Medium. Core retry module is small; wrapping SDK calls cleanly is the challenge.

---

### Gap 3: --dry-run on Write Commands

**What's missing:** No way to preview what a write operation would send without executing it.

**Write commands that need --dry-run:**
- `transactions create`
- `transactions update`
- `transactions delete`
- `transactions split`
- `transactions batch-update`
- `transactions import`
- `categories update`
- `categories budget`
- `payees update`
- `scheduled delete`
- `api` (POST/PUT/PATCH/DELETE)

**Where:** `src/lib/command-utils.ts` — add a `dryRun()` helper. Each write command checks `options.dryRun` before calling the client.

**New behavior:**
```bash
ynab transactions create --account abc --amount -25.50 --dry-run
# Output: { "dry_run": true, "method": "POST", "resource": "transactions", "payload": { ... } }
```

- Shows the exact payload that would be sent (after milliunit conversion, validation)
- Exits 0 (not an error)
- No API call made

**Complexity:** Low-Medium. Mechanical — add flag and early-return to each write action.

---

### Gap 4: --format Flag (table, csv, yaml)

**What's missing:** Output is JSON-only. `outputJson()` in `src/lib/output.ts` is the single output path.

**Where:** `src/lib/output.ts` — extend `outputJson` (rename to `output`) to support format selection. Add `--format` as a global option in `src/cli.ts` alongside `--compact`.

**New behavior:**
```bash
ynab transactions list --format table    # ASCII table
ynab transactions list --format csv      # CSV with headers
ynab transactions list --format yaml     # YAML
ynab transactions list --format json     # Default (current behavior)
```

**Implementation:**
- `table`: Use built-in `console.table` or a lightweight formatter (no new dep needed for basic tables)
- `csv`: Simple join with proper escaping (no dep needed)
- `yaml`: Minimal serializer or add `yaml` dependency
- Applies after milliunit conversion (existing `convertMilliunitsToAmounts`)

**Complexity:** Low-Medium. Core formatter is ~100 lines. Global flag wiring is straightforward.

---

### Gap 5: Granular Exit Codes

**What's missing:** All errors exit 1 via `process.exit(1)` in `formatErrorResponse()`. No distinction between auth failure, validation, not-found, rate limit, etc.

**Where:** `src/lib/errors.ts` — `formatErrorResponse()` and the `ERROR_STATUS_CODES` map.

**New exit code scheme:**

| Exit Code | Meaning | YNAB Error Names |
|-----------|---------|-----------------|
| 0 | Success | — |
| 1 | General/unknown error | unknown_error, cli_error |
| 2 | Authentication failure | not_authorized, subscription_lapsed, trial_expired |
| 3 | Validation / bad input | bad_request, unauthorized_scope |
| 4 | Resource not found | not_found, resource_not_found |
| 5 | Rate limited | too_many_requests |
| 6 | Server error | internal_server_error, service_unavailable |
| 7 | Conflict | conflict, data_limit_reached |

**Implementation:** Map `ERROR_STATUS_CODES` entries to exit codes. Update `formatErrorResponse` to use mapped exit code instead of hardcoded 1. Add exit code to JSON error output: `{ error: { name, detail, statusCode, exitCode } }`.

**Complexity:** Low. Small mapping change, ~20 lines.

---

### Gap 6: SKILL.md Files

**What's missing:** No agent-consumable skill files. The CLI is "AI-friendly" by design (JSON output, LLM keywords) but lacks structured skill definitions for agent orchestration.

**Where:** New `skills/` directory at repo root.

**Design:** See SKILL.md Tree Design section below.

**Complexity:** Medium. Content-heavy but no code changes.

---

## PR Plan

Ordered by impact (highest first):

### PR 1: Granular Exit Codes
- **Title:** `feat: granular exit codes for error types`
- **Description:** Map YNAB API error types to distinct exit codes (0-7). Enables agents and scripts to programmatically handle auth failures vs not-found vs rate limits.
- **Files:** `src/lib/errors.ts`
- **Complexity:** Low (1-2 hours)

### PR 2: Retry on 429/5xx
- **Title:** `feat: automatic retry with exponential backoff on 429/5xx`
- **Description:** Add retry logic with jitter for rate limits and server errors. Critical for agent use — 200 req/hr limit means agents will hit 429 regularly.
- **Files:** `src/lib/retry.ts` (new), `src/lib/api-client.ts`, `src/cli.ts` (--no-retry flag)
- **Complexity:** Medium (3-4 hours)

### PR 3: --dry-run on Write Commands
- **Title:** `feat: --dry-run flag for all write operations`
- **Description:** Preview payloads without executing. Essential for agent safety — agents can verify before committing.
- **Files:** `src/lib/command-utils.ts`, `src/commands/transactions.ts`, `src/commands/categories.ts`, `src/commands/payees.ts`, `src/commands/scheduled.ts`, `src/commands/api.ts`
- **Complexity:** Low-Medium (2-3 hours)

### PR 4: --format Flag
- **Title:** `feat: --format flag for table/csv/yaml output`
- **Description:** Add output format options beyond JSON. Table for human use, CSV for spreadsheet export, YAML for config workflows.
- **Files:** `src/lib/output.ts`, `src/cli.ts`, `src/lib/formatters.ts` (new)
- **Complexity:** Low-Medium (2-3 hours)

### PR 5: Auto-Delta Mode
- **Title:** `feat: --delta flag for automatic server_knowledge tracking`
- **Description:** Persist server_knowledge locally per resource/budget. `--delta` flag auto-fetches only changes since last sync.
- **Files:** `src/lib/knowledge-store.ts` (new), all `src/commands/*.ts` list actions
- **Complexity:** Medium (3-4 hours)

### PR 6: SKILL.md Files
- **Title:** `feat: add agent skill definitions (skills/ directory)`
- **Description:** Structured SKILL.md files for agent orchestration. Covers auth, each resource, and common recipes.
- **Files:** `skills/**/*.md` (new)
- **Complexity:** Medium (2-3 hours, content-heavy)

---

## SKILL.md Tree Design

```
skills/
├── ynab-shared/
│   └── SKILL.md          # Auth, global flags, security, error handling, common patterns
├── ynab-budgets/
│   └── SKILL.md          # Budget list/view/settings/set-default
├── ynab-accounts/
│   └── SKILL.md          # Account list/view/transactions
├── ynab-transactions/
│   └── SKILL.md          # Full CRUD, search, summary, split, batch, find-transfers
├── ynab-categories/
│   └── SKILL.md          # List/view/update/budget/transactions
├── ynab-payees/
│   └── SKILL.md          # List/view/update/locations/transactions
├── ynab-months/
│   └── SKILL.md          # Monthly budget list/view
├── ynab-scheduled/
│   └── SKILL.md          # Scheduled transactions list/view/delete
└── ynab-recipes/
    └── SKILL.md          # Common multi-step workflows (spending report, category rebalance, etc.)
```

**Pattern:** Each resource skill depends on `ynab-shared`. The shared skill covers auth, global flags (`--budget`, `--compact`, `--format`), error handling, and security rules (never expose tokens, confirm deletes). Resource skills document every subcommand with examples and agent-relevant notes.
