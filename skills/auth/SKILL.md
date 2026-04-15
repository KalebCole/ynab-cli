# Authentication Skills

Manages YNAB API authentication and authorization.

## Available Skills

- **login**: Authenticate with YNAB Personal Access Token
- **logout**: Remove stored credentials  

## Security Notes

- Uses OS keychain for secure token storage
- Supports environment variable fallback (YNAB_API_KEY)
- Provides security warnings for environment variables

## Prerequisites

- Valid YNAB account
- Personal Access Token from YNAB settings
- Keychain access (macOS/Windows/Linux)

## Related Skills

- All other skills require authentication
- Budget selection often follows authentication