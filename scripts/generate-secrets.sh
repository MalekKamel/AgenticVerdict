#!/bin/bash
set -e
SECRETS_DIR="secrets"
mkdir -p "$SECRETS_DIR"
generate_secret() {
  openssl rand -base64 32 | tr -d '\n' > "$SECRETS_DIR/$1.txt"
  chmod 600 "$SECRETS_DIR/$1.txt"
  echo "Generated $SECRETS_DIR/$1.txt"
}
generate_secret "jwt_secret"
generate_secret "db_password"
generate_secret "redis_password"
generate_secret "encryption_key"
generate_secret "storage_secret_key"
echo "Secrets generated successfully"
