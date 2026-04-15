# Transactions Skills

Comprehensive transaction management including CRUD operations, search, analysis, and specialized features.

## Available Skills

- **list**: List and filter transactions
- **create**: Create new transactions  
- **search**: Advanced transaction search
- **split**: Split transactions across categories
- **find-transfers**: Find transfer matches between accounts

## Core Capabilities

- Full CRUD operations (Create, Read, Update, Delete)
- Advanced filtering and search
- Transaction splitting for complex categorization
- Transfer detection and matching
- Batch operations for bulk updates
- Import from financial institutions

## Key Features

- Automatic amount conversion (dollars ↔ milliunits)
- Rich filtering options (date, amount, status, payee)
- Field selection for focused output
- Summary and analysis capabilities
- Transfer candidate detection

## Output Format

All transaction operations return JSON with automatic milliunit-to-dollar conversion for human readability.

## Related Skills

- Categories (for transaction categorization)
- Accounts (for account-specific transactions)  
- Payees (for payee-based filtering)
- Budgets (for budget context)