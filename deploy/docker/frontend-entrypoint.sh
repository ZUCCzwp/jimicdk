#!/bin/sh
set -e

export API_UPSTREAM="${API_UPSTREAM:-http://api:8888}"

if [ -f /etc/nginx/ssl/cert.pem ] && [ -f /etc/nginx/ssl/key.pem ]; then
  envsubst '${API_UPSTREAM}' < /etc/nginx/ssl-config/nginx-ssl.conf > /etc/nginx/conf.d/default.conf
else
  envsubst '${API_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'

