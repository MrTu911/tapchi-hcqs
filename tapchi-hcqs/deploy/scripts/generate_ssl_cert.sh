#!/bin/bash
# Generate self-signed SSL certificate for development/internal use

set -e

CERT_DIR="/home/ubuntu/tapchi-hcqs/deploy/certs"
COMMON_NAME="journal.hvc.local"

mkdir -p "${CERT_DIR}"

echo "Generating self-signed SSL certificate for ${COMMON_NAME}..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${CERT_DIR}/selfsigned.key" \
  -out "${CERT_DIR}/selfsigned.crt" \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=HVC/OU=IT/CN=${COMMON_NAME}"

chmod 644 "${CERT_DIR}/selfsigned.crt"
chmod 600 "${CERT_DIR}/selfsigned.key"

echo "✓ SSL certificate generated successfully!"
echo "Certificate: ${CERT_DIR}/selfsigned.crt"
echo "Private key: ${CERT_DIR}/selfsigned.key"
echo ""
echo "Note: This is a self-signed certificate for internal use only."
echo "For production, use certificates from a trusted CA."
