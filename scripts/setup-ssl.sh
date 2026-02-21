#!/bin/bash
# SSL Setup script for Nginx using Certbot and Let's Encrypt

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"

echo "Checking for certbot..."
if ! command -v certbot &> /dev/null
then
    echo "Certbot not found. Installing..."
    sudo apt-get update
    sudo apt-get install certbot python3-certbot-nginx -y
fi

echo "Requesting certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
