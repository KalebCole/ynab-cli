# Login Skill

Authenticate with YNAB using Personal Access Token.

## Description
Configures YNAB API authentication by storing access token securely in OS keychain.

## Usage
```bash
# Interactive login (prompts for token)
ynab auth login

# Non-interactive with token
ynab auth login --token <your-token>

# Via stdin
echo "your-token" | ynab auth login
```

## Parameters
- `--token <token>` (optional): YNAB Personal Access Token

## Output
```json
{
  "message": "Successfully authenticated",
  "user": {
    "id": "user-id"
  }
}
```

## Use Cases
- Initial setup of CLI
- Token rotation/updates
- Switching between accounts
- Automated authentication in scripts

## Error Handling
- Validates token by testing API access
- Removes invalid tokens automatically
- Provides clear error messages for auth failures

## Security
- Token stored in OS keychain (not plaintext)
- Token not echoed in terminal
- Secure token validation before storage