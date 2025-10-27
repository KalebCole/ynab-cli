# YNAB CLI

A command-line interface for You Need a Budget (YNAB) designed to enable LLMs (Claude, ChatGPT, etc.) and developers to quickly interface with YNAB budgets, make changes, and audit financial data.

## Features

- **LLM-First Design**: JSON output by default for easy parsing and integration with AI assistants
- **Comprehensive Coverage**: Support for all major YNAB API endpoints
- **Type Safety**: Built with TypeScript for robust error handling
- **Raw API Access**: Fallback command for any operation not covered by convenience commands
- **Simple Authentication**: Uses personal access tokens stored securely in OS keychain

## Installation

```bash
npm install
npm run build
npm link  # Optional: makes `ynab` available globally
```

## Authentication

### Using Environment Variables (Recommended for Development)

Create a `.env` file in the project root:

```env
YNAB_API_KEY=your_personal_access_token
YNAB_BUDGET_ID=your_default_budget_id  # Optional
```

### Using the CLI

```bash
ynab auth login    # Interactive token entry, stored in OS keychain
ynab auth status   # Check authentication status
ynab auth logout   # Remove stored credentials
```

## Usage

### Global Flags

```bash
--compact, -c          # Minified JSON output (single line)
--output, -o <file>    # Write output to file instead of stdout
--budget, -b <id>      # Specify budget ID (uses default/env if not specified)
```

### Commands

#### User

```bash
ynab user info    # Get authenticated user information
```

#### Budgets

```bash
ynab budgets list                 # List all budgets
ynab budgets view [id]            # View budget details
ynab budgets settings [id]        # View budget settings
ynab budgets set-default <id>     # Set default budget
```

#### Accounts

```bash
ynab accounts list                # List all accounts
ynab accounts view <id>           # View account details
ynab accounts transactions <id>   # List transactions for account
```

#### Categories

```bash
ynab categories list                            # List all categories
ynab categories view <id>                       # View category details
ynab categories budget <id> --month <YYYY-MM> --amount <amount>
ynab categories transactions <id>               # List transactions for category
```

#### Transactions

```bash
# List operations
ynab transactions list                          # List recent transactions
ynab transactions list --account <id>           # Filter by account
ynab transactions list --category <id>          # Filter by category
ynab transactions list --payee <id>             # Filter by payee
ynab transactions list --month <YYYY-MM>        # Filter by month
ynab transactions list --since <YYYY-MM-DD>     # Filter since date

# CRUD operations
ynab transactions view <id>                     # View single transaction
ynab transactions create                        # Create transaction (interactive)
ynab transactions create --account <id> --amount <amount> --date <YYYY-MM-DD>
ynab transactions update <id> --amount <amount> # Update transaction
ynab transactions delete <id>                   # Delete transaction
ynab transactions import                        # Import transactions
ynab transactions split <id> --splits '[{"amount": -1000, "category_id": "xxx", "memo": "..."}]'
```

#### Scheduled Transactions

```bash
ynab scheduled list        # List all scheduled transactions
ynab scheduled view <id>   # View scheduled transaction
ynab scheduled delete <id> # Delete scheduled transaction
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
ynab months list            # List all budget months
ynab months view <YYYY-MM>  # View specific month details
```

#### Raw API Access

```bash
ynab api <method> <path> [--data <json>]

# Examples:
ynab api GET /budgets
ynab api GET /budgets/{budget_id}/transactions
ynab api POST /budgets/{budget_id}/transactions --data '{"transaction": {...}}'
```

## Examples

### Get recent transactions

```bash
ynab transactions list --since 2025-10-01
```

### Get transactions in compact format

```bash
ynab transactions list --since 2025-10-01 --compact
```

### Update a category budget

```bash
ynab categories budget <category-id> --month 2025-10 --amount 500
```

### Create a transaction

```bash
ynab transactions create --account <account-id> --amount -50.00 --payee-name "Coffee Shop" --date 2025-10-27
```

### Split a transaction

```bash
ynab transactions split <transaction-id> --splits '[
  {"amount": -2500, "category_id": "cat-id-1", "memo": "Groceries"},
  {"amount": -2500, "category_id": "cat-id-2", "memo": "Household items"}
]'
```

## Output Format

All commands return JSON by default:

### Success Response

```json
{
  "data": { ... },
  "server_knowledge": 123  // If applicable
}
```

### Error Response

```json
{
  "error": {
    "name": "error_name",
    "detail": "Error detail",
    "statusCode": 400
  }
}
```

## Currency Format

YNAB uses milliunits for currency:
- $10.00 = 10000 milliunits
- The CLI accepts amounts in currency units (e.g., 10.50) and converts automatically

## Development

```bash
npm run dev          # Run CLI in development mode with tsx
npm run build        # Build for production
npm run typecheck    # Type check without emitting
npm run lint         # Lint code
npm test            # Run tests
```

## API Rate Limits

- 200 requests per hour per access token
- Rolling window
- Returns HTTP 429 when exceeded

## References

- [YNAB API Documentation](https://api.ynab.com/)
- [YNAB JavaScript SDK](https://github.com/ynab/ynab-sdk-js)
- [Specification](./SPEC.md)

## License

MIT
