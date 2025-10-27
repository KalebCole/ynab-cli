# YNAB CLI

A command-line interface for You Need a Budget (YNAB) designed to enable LLMs (Claude, ChatGPT, etc.) and developers to quickly interface with YNAB budgets, make changes, and audit financial data.

## Features

- **LLM-First Design**: JSON output by default for easy parsing and integration with AI assistants
- **Advanced Filtering**: Built-in filters reduce need for external tools like `jq` - filter by approval status, amount ranges, field selection, and search capabilities
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
ynab transactions list --since <YYYY-MM-DD>     # Filter since date
ynab transactions list --until <YYYY-MM-DD>     # Filter until date

# Advanced filtering (LLM-friendly)
ynab transactions list --approved=false                                      # Only unapproved transactions
ynab transactions list --approved=true                                       # Only approved transactions
ynab transactions list --min-amount 100 --max-amount 500                     # Filter by amount range
ynab transactions list --since 2025-10-01 --until 2025-10-31                 # Date range filtering
ynab transactions list --status=cleared                                      # Only cleared transactions
ynab transactions list --status=cleared,reconciled                           # Multiple statuses
ynab transactions list --fields id,date,amount,memo                          # Select specific fields
ynab transactions list --approved=false --min-amount 50 --fields date,amount,payee_name

# Search transactions
ynab transactions search --memo "coffee"                                     # Search by memo text
ynab transactions search --payee-name "Amazon"                               # Search by payee name
ynab transactions search --amount 42.50                                      # Search by exact amount
ynab transactions search --memo "groceries" --since 2025-10-01               # Combine with date filter
ynab transactions search --payee-name "Amazon" --approved=true --fields date,amount,memo

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

### Find unapproved transactions over $100

```bash
ynab transactions list --approved=false --min-amount 100 --fields date,amount,payee_name,memo
```

### Search for specific transactions

```bash
# Find all approved Amazon purchases with memos
ynab transactions search --payee-name "Amazon" --approved=true --since 2025-10-01 --fields date,amount,memo

# Find transactions with "groceries" in memo
ynab transactions search --memo "groceries" --fields date,amount,payee_name,category_name
```

### Find transactions in a specific date and amount range

```bash
ynab transactions list --since 2025-10-01 --until 2025-10-31 --min-amount 500 --max-amount 600 --fields date,amount,payee_name,memo
```

### Find cleared or reconciled transactions

```bash
ynab transactions list --status=cleared,reconciled --since 2025-10-01 --fields date,amount,payee_name,cleared
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

All commands return JSON by default. List commands output arrays directly for easy processing:

### Success Response (Lists)

```json
[
  {
    "id": "abc123",
    "date": "2025-10-27",
    "amount": -5000,
    "payee_name": "Coffee Shop"
  }
]
```

### Success Response (Single Items)

```json
{
  "id": "abc123",
  "date": "2025-10-27",
  "amount": -5000,
  "payee_name": "Coffee Shop"
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
