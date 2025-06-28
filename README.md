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
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/.secrets/cloudflare.ini -d rzk.com.ru,*.rzk.com.ru --preferred-challenges dns-01
#Bot commands
addtickers - Add tickers BTC TON
tickers - All tickers
alerts - Alerts
orders - Orders
TODO 29.10.2024
1. Alert by candle, set notyfi done!
2. Batch pump coins. Think how to save data by interval  15min, 1h, etc...done!

TODO 17.02.2025
1. Doji patterns rsi sma ema test done!
2. Bug fix when set default alerts favorites disabled. use update() function. done!
TODO 18.02.2025
1. Test technical indicators to search trend tickers.Done!
2. Orders create edit. Risk manegment. SL TP in web....
3. Use bybit api for chart data, ws done!
TODO 21.03.2025
1. Scan shedule timeframes Autoupdate! Done!
2. Alert message _timeframe done!
3. Total alert count 6 done!! 26.03.2025
4. Test patterns RSI <30 MACD
TODO 27.03.2025
1. Add indicators to the chart.++++ done 28.03.2025
2. Lightweight chart move to v.5 +++ done
3. Order message notify by timeframe done 28.03.2025
4. Algolia sending records in batches +++ done 28.03.2025
5. Fetch algolia data for render js ---
6. Test all and rc-2 1.04.2025
TODO 1.04.2025
1. Add btn remove Indicators done
2. Cals Levels hide/show done
TODO 2.04.2025
1. Load timeframe config for levels done!
2. Add w d 4h 1h short btns done!
3. Change timeframe route format like 1h 30min done
TODO 5.04.2025
1. Add to scan config priceNear done!
2. Fix bug websoket kline.D timeframe done!
3. Fix real update kline return string data. Indicators update fine. done!


CRON schedule
1w 55 0 3 * * 1
1d 44 0 3 * * *
4h 33 0 3,7,11,15,19,23 * * *
2h 25 0 */2 * * *
1h 22 0 6-23 * * *
30min 11 */30 6-23 * * *
15min 5 */15 6-23 * * *
1min 1 * 6-23 * * *
//pattern settings
{
  "patternR":
  {
    "candlesCount":24,
    "extCount":3,
    "tolerancePercent":0.01,
    "touchCount":3,
    "priceNear":0.01
  },
  "patternS":
  {
    "candlesCount":24,
    "extCount":3,
    "tolerancePercent":0.01,
    "touchCount":3,
    "priceNear":0.01
  },
  "patternRSI":
  {
    "longRSI":30,
    "shortRSI":70
  }
}

handlebars src/web/views/client/history-positions.handlebars -f src/web/src/example.js