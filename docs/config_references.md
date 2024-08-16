# Config references

All config keys correspond to the environment variable name.

| Config key                    | Required | Default                                                                                | Description                                                                                       |
|-------------------------------|----------|----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| DATA_FOLDER                   | *        | Current working dir                                                                    | Specify the folder where temporary and data will be stored (Docker image already set this option) |
| WASCII_DEFAULT_DOC_PERMISSION |          | EDITABLE                                                                               | Permission applied to a document at its creation                                                  |
| ENABLE_GITLAB_OAUTH           | *        | false                                                                                  |                                                                                                   |
| GITLAB_CLIENT_ID              | *        |                                                                                        |                                                                                                   |
| GITLAB_CLIENT_SECRET          | *        |                                                                                        |                                                                                                   |
| GITLAB_SERVER_METADATA_URL    | *        | OpenID connect endpoint : https://<gitlab_server_url>/.well-known/openid-configuration |                                                                                                   |
| ENABLE_GITHUB_OAUTH           | *        | false                                                                                  |                                                                                                   |
| GITHUB_CLIENT_ID              | *        |                                                                                        |                                                                                                   |
| GITHUB_CLIENT_SECRET          | *        |                                                                                        |                                                                                                   |
| GITHUB_AUTHORIZE_URL          |          | https://github.com/login/oauth/authorize                                               |                                                                                                   |
| GITHUB_ACCESS_TOKEN_URL       |          | https://github.com/login/oauth/access_token                                            |                                                                                                   |
| WASCII_RUBY_FOLDER            | *        |                                                                                        | If Ruby is not in path, should'nt be necessary                                                    |
| WASCII_DEBUG                  |          |                                                                                        |                                                                                                   |
| WASCII_ASCIIDOCTOR_EXEC       | *        | asciidoc                                                                               | If AsciiDoctor tool is not in your path (Docker image set this option)                            |
| WASCII_LOG_LEVEL              |          | Info                                                                                   | From 1(debug) to 5(critical)                                                                      |
| ENABLE_REQUEST_LOGGING        |          | false                                                                                  | Enable or disable request information                                                             |
