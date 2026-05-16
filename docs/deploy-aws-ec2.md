# Deploy Audiosen Web on AWS EC2

This guide deploys the Next.js app on one Ubuntu EC2 server with Nginx, PM2, Cloudflare DNS, and HTTPS.

## 1. Create EC2 Instance

In AWS EC2, launch an instance:

- Name: `audiosen-web`
- OS: Ubuntu Server 24.04 LTS or 22.04 LTS
- Instance type: `t3.small` recommended, `t2.micro` works for light traffic
- Storage: 20 GB gp3
- Key pair: create/download one, for example `audiosen.pem`

Security group inbound rules:

- SSH `22`: your IP only
- HTTP `80`: anywhere
- HTTPS `443`: anywhere

## 2. Connect With SSH

From PowerShell, go to the folder where your `.pem` file is saved:

```powershell
ssh -i .\audiosen.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 3. Install Server Software

Run on the EC2 server:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx git curl

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

Check versions:

```bash
node -v
npm -v
pm2 -v
```

## 4. Clone The App

Run on EC2:

```bash
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
cd /var/www
git clone https://github.com/vivekshivaliya/audiosen-web.git
cd audiosen-web
```

## 5. Add Environment Variables

Create the production `.env`:

```bash
nano .env
```

Paste values based on `.env.example`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM=Audiosen <your_email@gmail.com>
MAIL_TO=your_email@gmail.com
RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

## 6. Build And Start The App

Run:

```bash
npm ci
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` prints one `sudo ...` command. Copy and run that command, then run:

```bash
pm2 save
```

Check app:

```bash
curl http://localhost:3000
pm2 status
```

## 7. Configure Nginx

Create an Nginx site:

```bash
sudo nano /etc/nginx/sites-available/audiosen.com
```

Paste:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name audiosen.com www.audiosen.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/audiosen.com /etc/nginx/sites-enabled/audiosen.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Point Cloudflare DNS To EC2

In Cloudflare DNS for `audiosen.com`, add:

| Type | Name | Content |
| --- | --- | --- |
| A | `@` | `YOUR_EC2_PUBLIC_IP` |
| CNAME | `www` | `audiosen.com` |

Start with both records as **DNS only** until SSL is installed.

## 9. Install HTTPS Certificate

After DNS points to the EC2 IP, run on EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d audiosen.com -d www.audiosen.com
```

Choose redirect HTTP to HTTPS when prompted.

Test renewal:

```bash
sudo certbot renew --dry-run
```

Then in Cloudflare SSL/TLS, set mode to **Full (strict)**.

## 10. Deploy Future Updates

When you make changes locally:

```powershell
git add .
git commit -m "Update site"
git push
```

Then SSH to EC2 and run:

```bash
cd /var/www/audiosen-web
git pull
npm ci
npm run build
pm2 restart audiosen-web
```

## 11. Submit To Google

After `https://audiosen.com` works:

1. Open Google Search Console.
2. Add domain property: `audiosen.com`.
3. Add Google TXT verification record in Cloudflare DNS.
4. Submit sitemap: `https://audiosen.com/sitemap.xml`.
5. Inspect `https://audiosen.com/` and request indexing.
