# Setup OAuth

## With Github

- Go to this page : https://github.com/settings/developers
- Click `New OAuth App`
  - Homepage URL must be the base URL of your WasciiDoc app
  - Set `Authorize callback URL` to `<wasciidoc_base_url>/auth/github/callback`
  - Create the app
- Now generate a secret and copy it, with the client ID to the config values `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- You can now set `ENABLE_GITHUB_OAUTH` to `true`

## With Gitlab

From your admin Gitlab account

- Navigate to `Admin area`/`Applications`
- Click `Add new application`
- Set Redirect URI to `<wasciidoc_base_url>/auth/github/callback`
- Only `openid` scope is required
- Copy the secret and the client ID to the config values `GITLAB_CLIENT_ID` and `GITLAB_CLIENT_SECRET`
- Set `GITLAB_SERVER_METADATA_URL` to `<your_gitlab_base_url>/.well-known/openid-configuration`
- You can now set `ENABLE_GITLAB_OAUTH` to `true`