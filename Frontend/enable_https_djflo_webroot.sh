#!/bin/bash
# Script pour activer HTTPS sur djflo.funkthetown.net avec Apache sans interrompre le site principal
# Utilise le mode --webroot de certbot

set -e

# Chemin racine du site Djflo
WEBROOT="/Djflo"
DOMAIN="djflo.funkthetown.net"
VHOST_SSL="/etc/apache2/sites-available/djflo-ssl.conf"

# 1. Générer le certificat Let's Encrypt (webroot)
echo "[1/4] Génération du certificat Let's Encrypt pour $DOMAIN (webroot=$WEBROOT) ..."
sudo certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN"

# 2. Créer le VirtualHost SSL si absent
echo "[2/4] Création du VirtualHost SSL Apache pour $DOMAIN ..."
if [ ! -f "$VHOST_SSL" ]; then
  sudo tee "$VHOST_SSL" > /dev/null <<EOF
<VirtualHost *:443>
    ServerName $DOMAIN
    DocumentRoot $WEBROOT

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem

    <Directory $WEBROOT>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog4{APACHE_LOG_DIR}/djflo_ssl_error.log
    CustomLog4{APACHE_LOG_DIR}/djflo_ssl_access.log combined
</VirtualHost>
EOF
else
  echo "Le fichier $VHOST_SSL existe déjà."
fi

# 3. Activer le site SSL et recharger Apache
echo "[3/4] Activation du VirtualHost SSL et rechargement d'Apache ..."
sudo a2ensite djflo-ssl.conf
sudo systemctl reload apache2

# 4. Fin
echo "[4/4] HTTPS est maintenant actif sur https://$DOMAIN"
  
