#!/bin/bash

# Script pour activer HTTPS (Let's Encrypt) sur djflo.funkthetown.net avec Apache
# Il arrête temporairement Node.js sur le port 80 si besoin

set -e

echo "[1/6] Installation de Certbot et du module SSL Apache..."
sudo apt update
sudo apt install -y certbot python3-certbot-apache
sudo a2enmod ssl

# Vérifier si le port 80 est occupé par Node.js
if sudo lsof -i :80 | grep node; then
    echo "[2/6] Node.js écoute sur le port 80. Arrêt temporaire de Node.js..."
    # Arrête tous les processus Node.js sur le port 80
    sudo fuser -k 80/tcp || true
    sleep 2
else
    echo "[2/6] Le port 80 est libre."
fi

# Ouvrir le port 443 dans le firewall si UFW est actif
if sudo ufw status | grep -q active; then
    echo "[3/6] Ouverture du port 443 dans UFW..."
    sudo ufw allow 443/tcp
fi

# Générer le certificat SSL Let's Encrypt

echo "[4/6] Lancement de Certbot pour djflo.funkthetown.net..."
sudo certbot --apache -d djflo.funkthetown.net

echo "[5/6] Redémarrage d'Apache..."
sudo systemctl restart apache2

echo "[6/6] Si Node.js doit être relancé, fais-le manuellement (ex: pm2 start ou node ...)."
echo "HTTPS est maintenant actif sur https://djflo.funkthetown.net"

