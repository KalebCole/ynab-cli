# Logout Skill

Remove stored YNAB credentials from keychain.

## Description
Securely removes stored access token from OS keychain and clears API client cache.

## Usage
```bash
ynab auth logout
```

## Parameters
None

## Output
```json
{
  "message": "Successfully logged out"
}
```

## Use Cases
- Security cleanup when done using CLI
- Switching between different YNAB accounts
- Troubleshooting authentication issues
- Preparing system for different user

## Related Operations
- Clears cached API client instance
- Removes keychain-stored token
- Does not affect environment variables

## Security
- Complete credential removal
- No residual authentication data
- Safe for shared/public systems