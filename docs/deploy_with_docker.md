# Deploy with Docker

A single port is exposed by WasciiDoc.

Run the image :
```bash
docker run -p 80:80 https://hub.docker.com/r/860000/wasciidoc/
```

## About SSL

SSL is currently not supported by AsciiDoc, we prefer to use a 
reverse proxy, which is simple to expose and configure for SSL.

### Apache SSL ReverseProxy

## Docker Compose

