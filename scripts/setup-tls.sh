#!/bin/bash
set -euo pipefail

CERTS_DIR="${CERTS_DIR:-deploy/tls}"
ENVIRONMENT="${ENVIRONMENT:-development}"

mkdir -p "$CERTS_DIR"

if [ "$ENVIRONMENT" = "development" ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/privkey.pem" \
    -out "$CERTS_DIR/fullchain.pem" \
    -subj "/C=SA/ST=Riyadh/L=Riyadh/O=AgenticVerdict/CN=localhost"
  chmod 644 "$CERTS_DIR/fullchain.pem"
  chmod 600 "$CERTS_DIR/privkey.pem"
  echo "TLS material ready under $CERTS_DIR"
else
  echo "ENVIRONMENT=$ENVIRONMENT — place real certs at $CERTS_DIR/fullchain.pem and $CERTS_DIR/privkey.pem (e.g. Certbot)." >&2
fi
