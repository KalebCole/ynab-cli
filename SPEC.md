# YNAB CLI Specification

## Overview

A command-line interface for You Need a Budget (YNAB) designed to enable LLMs (Claude, ChatGPT, etc.) and developers to quickly interface with YNAB budgets, make changes, and audit financial data that might be cumbersome to manage through the web interface.

**Inspiration**: GitHub CLI (`gh`) - well-structured commands with consistent patterns and powerful API fallback.

## Goals

1. **LLM-First Design**: JSON output by default for easy parsing and integration with AI assistants
2. **Comprehensive Coverage**: Support all YNAB API endpoints through intuitive commands
3. **Type Safety**: Leverage TypeScript for robust error handling and autocomplete
4. **Raw API Access**: Fallback command for any operation not covered by convenience commands
5. **Developer Friendly**: Simple installation, clear error messages, good documentation

## YNAB API Research

### Base Information

- **Base URL**: `https://api.ynab.com/v1`
- **API Version**: v1.77.0 (as of 2025)
- **Architecture**: REST API with JSON responses
- **API Type**: Mostly read-only (GET), with some POST, PATCH, PUT, DELETE operations

### Authentication

**Method**: HTTP Bearer Authentication (RFC6750)

**Options**:
1. **Personal Access Tokens** (Recommended for individual use)
   - Generated via Account Settings > Developer Settings
   - No expiration (but can be revoked)
   - Best for personal CLI usage

2. **OAuth Applications** (For multi-user apps)
   - Implicit Grant Flow: 2-hour token expiration
   - Authorization Code Grant Flow: Supports refresh tokens

**Headers**:
```
Authorization: Bearer <ACCESS_TOKEN>
```

**Rate Limiting**:
- 200 requests per hour per access token
- Rolling window
- Returns HTTP 429 when exceeded

### Error Handling

**Response Format**:
```json
{
  "error": {
    "id": "123",
    "name": "error_name",
    "detail": "Error detail"
  }
}
```

**Error Codes**:
- `400` (bad_request): Malformed syntax or validation errors
- `401` (not_authorized): Invalid/expired/missing token
- `403.1` (subscription_lapsed): Account subscription expired
- `403.2` (trial_expired): Trial period ended
- `403.3` (unauthorized_scope): Token lacks required scope
- `403.4` (data_limit_reached): Data abuse prevention limit
- `404.1` (not_found): URI doesn't exist
- `404.2` (resource_not_found): Resource doesn't exist
- `409` (conflict): Resource conflicts with existing data
- `429` (too_many_requests): Rate limit exceeded
- `500` (internal_server_error): Unexpected API error
- `503` (service_unavailable): API temporarily disabled/timeout

### Data Formats

- **Currency**: Milliunits format (1,000 = 1 currency unit)
- **Dates**: ISO 8601 format (YYYY-MM-DD) in UTC
- **Delta Requests**: Use `last_knowledge_of_server` parameter to fetch only changed data

## Complete API Endpoints

### User
- `GET /user` - Returns authenticated user information

### Budgets
- `GET /budgets` - List all budgets
  - Optional: `include_accounts` (boolean)
- `GET /budgets/{budget_id}` - Get single budget details
  - Optional: `last_knowledge_of_server` (integer)
- `GET /budgets/{budget_id}/settings` - Get budget settings

### Accounts
- `GET /budgets/{budget_id}/accounts` - List all accounts
  - Optional: `last_knowledge_of_server` (integer)
- `POST /budgets/{budget_id}/accounts` - Create new account
- `GET /budgets/{budget_id}/accounts/{account_id}` - Get single account

### Categories
- `GET /budgets/{budget_id}/categories` - List all categories
  - Optional: `last_knowledge_of_server` (integer)
- `GET /budgets/{budget_id}/categories/{category_id}` - Get single category
- `PATCH /budgets/{budget_id}/categories/{category_id}` - Update category
- `GET /budgets/{budget_id}/months/{month}/categories/{category_id}` - Get category for specific month
- `PATCH /budgets/{budget_id}/months/{month}/categories/{category_id}` - Update category budget for month

### Payees
- `GET /budgets/{budget_id}/payees` - List all payees
  - Optional: `last_knowledge_of_server` (integer)
- `GET /budgets/{budget_id}/payees/{payee_id}` - Get single payee
- `PATCH /budgets/{budget_id}/payees/{payee_id}` - Update payee (rename)

### Payee Locations
- `GET /budgets/{budget_id}/payee_locations` - List all payee locations
- `GET /budgets/{budget_id}/payee_locations/{payee_location_id}` - Get single location
- `GET /budgets/{budget_id}/payees/{payee_id}/payee_locations` - List locations for payee

### Months
- `GET /budgets/{budget_id}/months` - List all budget months
  - Optional: `last_knowledge_of_server` (integer)
- `GET /budgets/{budget_id}/months/{month}` - Get single budget month

### Transactions
- `GET /budgets/{budget_id}/transactions` - List all transactions
  - Optional: `since_date`, `type`, `last_knowledge_of_server`
- `POST /budgets/{budget_id}/transactions` - Create transaction(s)
- `PATCH /budgets/{budget_id}/transactions` - Update multiple transactions
- `POST /budgets/{budget_id}/transactions/import` - Import transactions
- `GET /budgets/{budget_id}/transactions/{transaction_id}` - Get single transaction
- `PUT /budgets/{budget_id}/transactions/{transaction_id}` - Update transaction
- `DELETE /budgets/{budget_id}/transactions/{transaction_id}` - Delete transaction
- `GET /budgets/{budget_id}/accounts/{account_id}/transactions` - List account transactions
- `GET /budgets/{budget_id}/categories/{category_id}/transactions` - List category transactions
- `GET /budgets/{budget_id}/payees/{payee_id}/transactions` - List payee transactions
- `GET /budgets/{budget_id}/months/{month}/transactions` - List month transactions

### Scheduled Transactions
- `GET /budgets/{budget_id}/scheduled_transactions` - List all scheduled transactions
  - Optional: `last_knowledge_of_server` (integer)
- `POST /budgets/{budget_id}/scheduled_transactions` - Create scheduled transaction
- `GET /budgets/{budget_id}/scheduled_transactions/{scheduled_transaction_id}` - Get single scheduled transaction
- `PUT /budgets/{budget_id}/scheduled_transactions/{scheduled_transaction_id}` - Update scheduled transaction
- `DELETE /budgets/{budget_id}/scheduled_transactions/{scheduled_transaction_id}` - Delete scheduled transaction

## CLI Architecture

### Command Pattern

Following GitHub CLI conventions:
```bash
ynab <command> <subcommand> [arguments] [flags]
```

### Core Commands

```
ynab user            User information
ynab auth            Authentication management
ynab budgets         Budget operations
ynab accounts        Account operations
ynab categories      Category operations
ynab transactions    Transaction operations (primary workflow)
ynab scheduled       Scheduled transaction operations
ynab payees          Payee operations
ynab months          Monthly budget operations
ynab api             Raw API fallback
```

### Command Details

#### User
```bash
ynab user info                 # Get authenticated user information
```

#### Authentication
```bash
ynab auth login                # Configure access token (interactive)
ynab auth status               # Check authentication status
ynab auth logout               # Remove stored credentials
```

#### Budgets
```bash
ynab budgets list              # List all budgets
ynab budgets view [id]         # View budget details (uses default if no id)
ynab budgets settings [id]     # View budget settings
ynab budgets set-default <id>  # Set default budget for commands
```

#### Accounts
```bash
ynab accounts list                      # List all accounts
ynab accounts view <id>                 # View account details
ynab accounts create                    # Create account (interactive)
ynab accounts transactions <id>         # List transactions for account
```

#### Categories
```bash
ynab categories list                            # List all categories
ynab categories view <id>                       # View category details
ynab categories update <id>                     # Update category (interactive)
ynab categories budget <id> --month <month> --amount <milliunits>
ynab categories transactions <id>               # List transactions for category
```

#### Transactions (Most Important)
```bash
# List operations
ynab transactions list                          # List recent transactions
ynab transactions list --account <id>           # Filter by account
ynab transactions list --category <id>          # Filter by category
ynab transactions list --payee <id>             # Filter by payee
ynab transactions list --month <YYYY-MM>        # Filter by month
ynab transactions list --since <YYYY-MM-DD>     # Filter since date
ynab transactions list --type <type>            # Filter by type

# CRUD operations
ynab transactions view <id>                     # View single transaction
ynab transactions create                        # Create transaction (interactive)
ynab transactions update <id>                   # Update transaction (interactive)
ynab transactions delete <id>                   # Delete transaction
ynab transactions import                        # Import transactions (interactive)
```

#### Scheduled Transactions
```bash
ynab scheduled list             # List all scheduled transactions
ynab scheduled view <id>        # View scheduled transaction
ynab scheduled create           # Create scheduled transaction (interactive)
ynab scheduled update <id>      # Update scheduled transaction (interactive)
ynab scheduled delete <id>      # Delete scheduled transaction
```

#### Payees
```bash
ynab payees list                        # List all payees
ynab payees view <id>                   # View payee details
ynab payees update <id> --name <name>   # Rename payee
ynab payees locations <id>              # List locations for payee
ynab payees transactions <id>           # List transactions for payee
```

#### Months
```bash
ynab months list                # List all budget months
ynab months view <YYYY-MM>      # View specific month details
ynab months transactions <YYYY-MM>  # List transactions for month
```

#### Raw API Access
```bash
ynab api <method> <path> [--data <json>]

# Examples:
ynab api GET /budgets
ynab api GET /budgets/{budget_id}/transactions
ynab api POST /budgets/{budget_id}/transactions --data '{"transaction": {...}}'
ynab api PATCH /budgets/{budget_id}/categories/{id} --data '{"category": {...}}'
ynab api DELETE /budgets/{budget_id}/transactions/{id}
```

### Global Flags

```bash
--budget, -b <id>      Specify budget ID (uses default if not specified)
--compact, -c          Minified JSON output (single line)
--output, -o <file>    Write output to file instead of stdout
--help, -h             Show help
--version, -v          Show version
```

### Output Format

**Default**: Pretty-printed JSON
- Easy for LLMs to parse
- Human-readable when needed
- Consistent across all commands

**Compact Mode** (`--compact`): Minified single-line JSON
- For piping to other tools
- Reduces output size

**Future Enhancement**: `--format table` for human-friendly tables

## Technology Stack

### Runtime & Language
- **Node.js** with **TypeScript**
- Target: Node.js 18+ (for native fetch, etc.)

### Core Dependencies

```json
{
  "ynab": "^3.0.0",           // Official YNAB SDK with TypeScript support
  "commander": "^12.0.0",     // CLI framework (alternative: oclif)
  "chalk": "^5.3.0",          // Colored terminal output
  "inquirer": "^9.2.0",       // Interactive prompts
  "conf": "^12.0.0",          // Config storage
  "keytar": "^7.9.0",         // Secure credential storage (OS keychain)
  "date-fns": "^3.0.0",       // Date parsing and formatting
  "zod": "^3.22.0"            // Runtime validation
}
```

### Dev Dependencies

```json
{
  "@types/node": "^20.0.0",
  "@types/inquirer": "^9.0.0",
  "typescript": "^5.3.0",
  "tsx": "^4.7.0",            // TypeScript execution
  "tsup": "^8.0.0",           // Fast bundler
  "vitest": "^1.2.0",         // Testing framework
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "eslint": "^8.56.0"
}
```

## Project Structure

```
ynab-cli/
├── src/
│   ├── commands/
│   │   ├── user.ts              # User commands
│   │   ├── auth.ts              # Authentication commands
│   │   ├── budgets.ts           # Budget commands
│   │   ├── accounts.ts          # Account commands
│   │   ├── categories.ts        # Category commands
│   │   ├── transactions.ts      # Transaction commands (main)
│   │   ├── scheduled.ts         # Scheduled transaction commands
│   │   ├── payees.ts            # Payee commands
│   │   ├── months.ts            # Month commands
│   │   └── api.ts               # Raw API fallback
│   ├── lib/
│   │   ├── api-client.ts        # YNAB SDK wrapper & initialization
│   │   ├── auth.ts              # Authentication management
│   │   ├── config.ts            # Configuration management
│   │   ├── output.ts            # Output formatting (JSON)
│   │   ├── errors.ts            # Error handling & mapping
│   │   ├── prompts.ts           # Interactive prompts
│   │   └── utils.ts             # Shared utilities
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   └── cli.ts                   # Entry point & CLI setup
├── tests/
│   ├── commands/                # Command tests
│   └── lib/                     # Library tests
├── .gitignore
├── package.json
├── tsconfig.json
├── tsup.config.ts               # Build configuration
├── README.md
└── spec.md                      # This file
```

## Configuration & Storage

### Config File Location
`~/.config/ynab-cli/config.json`

```json
{
  "defaultBudget": "budget-uuid",
  "version": "1.0.0"
}
```

### Credential Storage
Use OS keychain via `keytar` (similar to GitHub CLI):
- **macOS**: Keychain Access
- **Linux**: libsecret (GNOME Keyring, KWallet)
- **Windows**: Credential Vault

Stored as: `ynab-cli:access-token`

## Implementation Plan

### Phase 1: Foundation
1. Project setup with TypeScript, dependencies
2. CLI framework setup with Commander
3. Authentication flow (login, status, logout)
4. Config management
5. API client wrapper around YNAB SDK
6. Output formatting (JSON pretty/compact)
7. Error handling

### Phase 2: Core Commands
8. User commands
9. Budget commands
10. Account commands (read-only)
11. Transaction commands (full CRUD) - Priority
12. Category commands (read + update budget)
13. Payee commands (read + rename)

### Phase 3: Advanced Commands
14. Scheduled transaction commands (full CRUD)
15. Month commands (read-only)
16. Raw API fallback command

### Phase 4: Polish
17. Interactive prompts for create/update operations
18. Comprehensive error messages
19. Unit tests
20. Integration tests (with mock API)
21. Documentation
22. CLI help text
23. README with examples

### Phase 5: Publishing
24. Package for npm
25. Binary builds for major platforms
26. CI/CD setup

## Special Features for LLM Integration

### 1. Predictable JSON Output
All commands return consistent JSON structure:
```json
{
  "data": { ... },
  "server_knowledge": 123  // If applicable
}
```

Errors:
```json
{
  "error": {
    "name": "error_name",
    "detail": "Error detail",
    "statusCode": 400
  }
}
```

### 2. Batch Operations
Support for batch transaction creation/updates to minimize API calls:
```bash
ynab transactions create --batch transactions.json
```

### 3. Smart Defaults
- Use default budget when not specified
- Reasonable date defaults (today for transactions, current month for budgets)
- Interactive mode when required parameters missing

### 4. Audit Commands (Future)
LLM-friendly analysis commands:
```bash
ynab audit overspending --month 2025-01
ynab audit uncategorized
ynab audit budget-vs-actual --month 2025-01
ynab audit spending-trends --category <id> --months 6
```

## API Client Design

### Wrapper Pattern
Wrap the YNAB SDK to:
1. Handle authentication automatically
2. Provide consistent error handling
3. Add retry logic for rate limits
4. Log API calls (optional, for debugging)
5. Cache budget ID resolution (name -> ID)

### Example Structure
```typescript
export class YnabClient {
  private api: ynab.API;
  private config: Config;

  constructor(accessToken: string, config: Config) {
    this.api = new ynab.API(accessToken);
    this.config = config;
  }

  async getBudgetId(budgetIdOrDefault?: string): Promise<string> {
    if (budgetIdOrDefault) return budgetIdOrDefault;
    if (this.config.defaultBudget) return this.config.defaultBudget;
    throw new Error('No budget specified and no default set');
  }

  async getTransactions(params: {
    budgetId?: string;
    accountId?: string;
    categoryId?: string;
    payeeId?: string;
    sinceDate?: string;
    type?: string;
  }): Promise<ynab.TransactionDetail[]> {
    const budgetId = await this.getBudgetId(params.budgetId);
    // Implementation with error handling
  }

  // ... more methods
}
```

## Error Handling Strategy

### 1. API Errors
Map YNAB API errors to user-friendly messages:
```typescript
function handleYnabError(error: any): never {
  if (error.error) {
    const { name, detail, id } = error.error;

    switch (name) {
      case 'not_authorized':
        console.error('Authentication failed. Run: ynab auth login');
        break;
      case 'too_many_requests':
        console.error('Rate limit exceeded. Try again in a few minutes.');
        break;
      // ... more cases
      default:
        console.error(`API Error: ${detail}`);
    }
  }
  process.exit(1);
}
```

### 2. Validation Errors
Use Zod for runtime validation of user inputs before API calls

### 3. Network Errors
Provide clear messages for network issues, timeouts, etc.

## Testing Strategy

### Unit Tests
- Test each command's logic in isolation
- Mock the YNAB API client
- Test error handling paths

### Integration Tests
- Use YNAB API mocks (could use MSW)
- Test full command flows
- Test authentication flows

### Manual Testing
- Test against real YNAB account (sandboxed budget)
- Verify all commands work end-to-end

## Documentation Requirements

### README.md
- Installation instructions
- Quick start guide
- Authentication setup
- Common usage examples
- Link to full command reference

### Command Help Text
Each command should have:
- Brief description
- Usage examples
- List of flags and arguments
- Related commands

### API Reference
Auto-generated from TypeScript types and JSDoc comments

## References

### Official Documentation
- **YNAB API Documentation**: https://api.ynab.com/
- **YNAB API Endpoints**: https://api.ynab.com/v1
- **YNAB OpenAPI Spec**: https://api.ynab.com/papi/open_api_spec.yaml
- **YNAB JavaScript SDK**: https://github.com/ynab/ynab-sdk-js
- **YNAB API Support**: https://support.ynab.com/en_us/the-ynab-api-an-overview-BJMgQ3zAq

### Similar Projects
- **GitHub CLI**: https://cli.github.com/ (inspiration for command structure)
- **Existing YNAB CLI**: https://borsboom.io/cli-for-ynab/ (for reference, different approach)

### Related Tools
- **Commander.js**: https://github.com/tj/commander.js
- **Inquirer.js**: https://github.com/SBoudrias/Inquirer.js
- **OCLIF**: https://oclif.io/ (alternative CLI framework)

## Development Notes

### Currency Handling
Remember that YNAB uses milliunits:
- $10.00 = 10000 milliunits
- Always convert user input to milliunits
- Always convert API output back to currency for display (if adding table format)

### Date Handling
- API expects ISO 8601 format (YYYY-MM-DD)
- Use date-fns for parsing user input and formatting
- Store in UTC, display in user's timezone

### Budget ID Resolution
Users might want to:
1. Specify budget by ID: `--budget <uuid>`
2. Use default budget (from config)
3. Select interactively (if neither provided)

Implement smart resolution that works in all scenarios

### Interactive vs. Non-Interactive
Commands should work both ways:
- **Interactive**: Prompt for missing required fields
- **Non-Interactive**: Accept all fields as flags (for LLM/script usage)

Detect TTY to determine mode:
```typescript
const isInteractive = process.stdin.isTTY;
```

## Security Considerations

1. **Never log access tokens**: Redact tokens in debug logs
2. **Secure storage**: Use OS keychain, never plain text files
3. **Clear error messages**: Don't expose tokens in error messages
4. **HTTPS only**: SDK handles this, but verify
5. **Rate limit handling**: Respect API limits, implement backoff

## Future Enhancements

### v2 Features
- Table output format for human readability
- CSV export for spreadsheet analysis
- Budget templates (create transactions from templates)
- Recurring transaction analysis
- Category budget suggestions based on spending patterns
- Multi-budget operations (for users with multiple budgets)
- Webhook support (for automated workflows)

### v3 Features
- TUI (Terminal UI) mode for interactive browsing
- Transaction reconciliation helpers
- Budget goal tracking and progress
- Spending analytics and insights
- Integration with other financial tools

## License

TBD - Likely MIT or Apache 2.0 for open source

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Status**: Ready for Implementation
