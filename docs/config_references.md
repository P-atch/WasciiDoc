# Config references

All config keys correspond to the environment variable name.

| Config key                 | Required | Default             | Description                                                                                       |
|----------------------------|----------|---------------------|---------------------------------------------------------------------------------------------------|
| DATA_FOLDER                | *        | Current working dir | Specify the folder where temporary and data will be stored (Docker image already set this option) |
| ENABLE_GITLAB_OAUTH        | *        | false               |                                                                                                   |
| GITLAB_CLIENT_ID           | *        |                     |                                                                                                   |
| GITLAB_CLIENT_SECRET       | *        |                     |                                                                                                   |
| GITLAB_SERVER_METADATA_URL | *        |                     |                                                                                                   |
| ENABLE_GITHUB_OAUTH        | *        | false               |                                                                                                   |
| GITHUB_CLIENT_ID           | *        |                     |                                                                                                   |
| GITHUB_CLIENT_SECRET       | *        |                     |                                                                                                   |
| GITHUB_AUTHORIZE_URL       | *        |                     |                                                                                                   |
| GITHUB_ACCESS_TOKEN_URL    | *        |                     |                                                                                                   |
| WASCII_RUBY_FOLDER         | *        |                     | If Ruby is not in path, should'nt be necessary                                                    |
| WASCII_DEBUG               |          |                     |                                                                                                   |
| WASCII_ASCIIDOCTOR_EXEC    | *        | asciidoc            | If AsciiDoctor tool is not in your path                                                           |
| WASCII_LOG_LEVEL           |          | Info                | From 1(debug) to 5(critical)                                                                      |