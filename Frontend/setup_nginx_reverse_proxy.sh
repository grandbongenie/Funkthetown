#!/bin/bash
# Script complet pour une architecture robuste : nginx reverse proxy pour Apache (Djflo) et Node.js (funkthetown.net)

set -e

# 1. Arrêter Node.js s'il écoute sur 80/443
NODE_PID=$(sudo ss -tulpn | grep ':80\|:443' | grep node | awk '{print $NF}' | sed 's/.*,pid=\([0-9]*\),.*/\1/' | head -n1)
if [ -n "$NODE_PID" ]; then
  echo "[1/6] Arrêt de Node.js sur les ports 80/443 (PID: $NODE_PID) ..."
  sudo kill $NODE_PID
  sleep 2
else
  echo "[1/6] Node.js n'écoute pas sur 80/443."
fi

# 2. Démarrer nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 3. Exemple de configuration nginx pour reverse proxy
NGINX_CONF="/etc/nginx/sites-available/reverse-proxy"
if [ ! -f "$NGINX_CONF" ]; then
  sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name djflo.funkthetown.net;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name funkthetown.net www.funkthetown.net;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name djflo.funkthetown.net;
    ssl_certificate /etc/letsencrypt/live/djflo.funkthetown.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/djflo.funkthetown.net/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name funkthetown.net www.funkthetown.net;
    ssl_certificate /etc/letsencrypt/live/funkthetown.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/funkthetown.net/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
else
  echo "Le fichier $NGINX_CONF existe déjà."
fi

# 4. Activer la config nginx
if [ ! -f /etc/nginx/sites-enabled/reverse-proxy ]; then
  sudo ln -s /etc/nginx/sites-available/reverse-proxy /etc/nginx/sites-enabled/reverse-proxy
fi

# 5. Tester et recharger nginx
sudo nginx -t
sudo systemctl reload nginx

echo "[6/6] Architecture reverse proxy nginx/Apache/Node.js en place."
echo "- djflo.funkthetown.net (HTTP/HTTPS) → Apache sur 8080"
echo "- funkthetown.net (HTTP/HTTPS) → Node.js sur 3000"
echo "Relance ensuite Node.js sur le port 3000 (ex: node app.js --port 3000 ou pm2 start ...)"

