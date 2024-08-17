# Deploy with Docker

A single port is exposed by WasciiDoc.

Run the image :
```bash
$ sudo docker run -p 80:80 860000/wasciidoc:main
```

## About SSL

SSL is currently not supported by AsciiDoc, we prefer to use a 
reverse proxy, which is simple to expose and configure for SSL.

### Apache SSL ReverseProxy

This is an example of site config file with SSL enabled 
```
<VirtualHost *:443>
    SSLEngine On
    SSLCertificateFile <Certificate file>
    SSLCertificateKeyFile <Private key file>
    ServerName example.com
    # Give origin request information
    ProxyPreserveHost On
    RequestHeader set "X-Forwarded-Proto" expr=%{REQUEST_SCHEME}

    # Redirect ws to ws:localhost:<private_port>
    RewriteEngine on
    RewriteCond %{REQUEST_URI} ^/socket.io             [NC]
    RewriteCond %{HTTP:Upgrade} =websocket             [NC]
    RewriteRule /(.*)  ws://127.0.0.1:3000/$1          [P,L]
    
    # Redirect http to http:localhost:<private_port>
    ProxyPass / http://127.0.0.1:3000/
 
</VirtualHost>
```

## Docker Compose
 
```
version: '3'
services:
  app:
    image: 860000/wasciidoc:main
    environment:
      - ENABLE_GITHUB_OAUTH=true
      - GITHUB_CLIENT_ID=<github_client_id>
      - GITHUB_CLIENT_SECRET=<github_client_secret>
      - GITHUB_AUTHORIZE_URL=https://github.com/login/oauth/authorize
      - GITHUB_ACCESS_TOKEN_URL=https://github.com/login/oauth/access_token

    volumes:
      - data:/opt/wasciidoc/workdir
    ports:
      - "80:80"
    restart: unless-stopped
volumes:
  data:
```

- This simple config allows to put persistent data in the Docker volume `data`.
- Disable Github OAuth to disable authentication (not recommended), or set another authentication method.
- This config does not allows to enable SSL, you will have modify it and add an Apache/Nginx reverse proxy, or add an external reverse proxy
=======

## About SSL

SSL is currently not supported by AsciiDoc, we prefer to use a 
reverse proxy, which is simple to expose and configure for SSL.

SSL is currently not supported by AsciiDoc, we prefer to use a 
reverse proxy, which is simple to expose and configure for SSL.
