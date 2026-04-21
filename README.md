# [PRODUCT_NAME]

> One sentence: what it does and who it's for.

## Setup

```bash
cp .env.example .env
# Fill in your keys in .env
npm install
npm run dev
```

## Stack

- **Frontend:** React / Next.js
- **Backend:** PocketBase (+ FastAPI if needed)
- **Payments:** Stripe
- **Hosting:** Hetzner VPS behind Cloudflare

## Deploy

```
Cloudflare DNS -> Hetzner VPS -> Caddy reverse proxy
                                  +-- PocketBase :8090
                                  +-- FastAPI :8000 (if needed)
                                  +-- Next.js :3000
```

## Links

- **Live:** https://[domain]
- **PocketBase Admin:** https://[domain]/pb/_/
- **Stripe Dashboard:** https://dashboard.stripe.com
