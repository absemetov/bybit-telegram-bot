# Config bybit site
sudo nano /etc/nginx/sites-available/bybit.rzk.com.ua.conf

server {
  #listen 80; # Listen on port 80
  #listen [::]:80; # Listen on port 80 for ipv6

  server_name bybit.rzk.com.ua;
    location / {
      proxy_pass http://127.0.0.1:3003;
      proxy_set_header X-Forwarded-Host $host;
    }
}

sudo ln -s /etc/nginx/sites-available/bybit.rzk.com.ua.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bybit.rzk.com.ru.conf /etc/nginx/sites-enabled/

sudo systemctl reload nginx

# Start all applications
pm2 start ecosystem.config.js

#certbot
sudo  certbot certonly --standalone --preferred-challenges http -d rzk.com.ru
(sudo certbot renew --dry-run)
sudo certbot certonly --manual --preferred-challenges=dns --server https://acme-v02.api.letsencrypt.org/directory --agree-tos -d *.rzk.com.ru
TODO 29.10
1. Alert by candle, set notyfi
2. Batch pump coins. Think how to save data by interval  15min, 1h, etc...
3. 