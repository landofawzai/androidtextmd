# PROJECT RULES — Read this first

> This file lives in the root of every micro-product repository.
> Claude Code: read this before writing any code.

---

## Who is building this

Solo developer. No team. No time for maintenance, client calls, or ongoing support. Build it, launch it, walk away. Ministry work is the priority — these products fund it passively.

---

## Tech Stack (non-negotiable)

| Layer | Tool | Cost |
|-------|------|------|
| Domain + DNS + CDN + SSL | Cloudflare Registrar | ~$8–10/year |
| Database + Auth + Files + API | PocketBase (self-hosted on Hetzner) | $0 |
| Hosting | Hetzner VPS | $0 incremental |
| Payments | Stripe (existing account) | 2.9% + $0.30/tx |
| Backend (if needed beyond PocketBase) | Python / FastAPI | $0 |
| Frontend | React / Next.js | $0 |
| AI | Claude API / OpenRouter (DeepSeek V3.2 for value) | Usage-based |
| Dev Tools | Claude Code + gstack in VS Code | Existing |
| Version Control | GitHub (private repos) + GitHub Desktop | $0 |
| Backups | Cron → Cloudflare R2 (10GB free) or second location | $0 |

**DO NOT USE:** Supabase, Lemon Squeezy, Namecheap, Vercel, Firebase, or any service with a paid tier cliff. If it's not in the table above, ask first.

---

## Product Criteria (every product must pass ALL)

1. **Build time:** Shippable in 3–14 days with Claude Code
2. **Maintenance:** Near-zero — no client engagement, no content moderation, no manual processes
3. **Self-service:** User signs up and uses it. No onboarding calls, no demos, no custom work
4. **Revenue:** $100–$2,000/month via subscriptions, one-time purchases, or usage pricing
5. **Single pain point:** Solves ONE specific, repeated problem real people have
6. **Global market:** Works for English-speaking users worldwide, not just US/Canada/UK/Australia
7. **Sellable:** Clean enough that someone could buy the product on an acquisition marketplace

---

## Architecture Principles

**PocketBase first.** If the product is CRUD + auth + file storage, PocketBase handles everything. No FastAPI needed.

**FastAPI alongside PocketBase only when:**
- AI-powered endpoints (Claude API calls, text processing)
- Complex business logic beyond CRUD
- Webhook handlers (Stripe webhooks)
- Custom API transformations

**Deployment pattern:**
```
Cloudflare DNS → Hetzner VPS → Caddy reverse proxy
                                  ├── PocketBase :8090
                                  ├── FastAPI :8000 (if needed)
                                  └── Static frontend (or Cloudflare Pages)
```

**Backups:** PocketBase is a single SQLite file. Cron job copies it nightly to Cloudflare R2 or a second directory.

---

## Pricing Principles

- **Stripe only** — 2.9% + $0.30/tx. Add Stripe Tax (0.5%) only when needed.
- **Always offer a one-time purchase option** alongside subscriptions — critical for global markets where recurring international card charges fail
- **Free tier with built-in virality** — "Powered by [Product]" on free outputs drives organic growth
- **Regional pricing** — implement via geo-based Stripe Price IDs or checkout logic. US: full price. India/Philippines/Nigeria/Kenya: ~40–50% of US price.
- **Keep it simple** — 2–3 tiers max. No enterprise tier. No custom plans.

---

## Marketing Principles

**Target market priority:**

| Tier | Countries | Meta CPM | Strategy |
|------|-----------|----------|----------|
| A (sweet spot) | India, Philippines, Nigeria, Kenya, South Africa, Malaysia, Pakistan, Ghana | $1.50–$3.00 | Primary paid ads target — 7–15× reach vs US |
| B (secondary) | Singapore, UAE, Netherlands, Sweden, Germany, Israel | $5–$10 | Secondary if product fits |
| C (expensive) | US, Canada, UK, Australia | $10–$23 | Organic only unless revenue justifies paid |

**Channel priority (ranked):**

1. **SEO** — 5–10 long-tail blog posts targeting the pain point. Compounds forever. $0.
2. **Built-in virality** — "Powered by" branding on free tier outputs. $0.
3. **Reddit / communities** — solve problems, mention tool naturally. $0.
4. **Product Hunt** — one-time launch event. $0.
5. **Niche newsletters** — $25–$100/issue for micro-newsletters. High ROI.
6. **Meta Ads (Tier A)** — $5/day targeting English speakers in low-CPM countries.
7. **Google Ads (long-tail)** — $3–$10/day on specific problem-solution keywords.

**Do NOT spend on:** LinkedIn Ads, Google Display Network, TikTok Ads (maintenance burden).

---

## Code Standards

- **Single-purpose files** — each file does one thing
- **Minimal dependencies** — fewer packages = less maintenance = less breakage
- **No over-engineering** — no microservices, no containers unless the product specifically needs them, no complex CI/CD
- **Error handling everywhere** — try/catch on all API calls, user-friendly error messages, never crash silently
- **Mobile-first UI** — most global users are on phones
- **Self-documenting** — clear naming, brief comments on non-obvious logic

---

## Launch Checklist

Before calling a product "shipped":

- [ ] Landing page explains the product in one sentence
- [ ] Free tier works without payment
- [ ] Stripe checkout works (test mode verified)
- [ ] Works on mobile
- [ ] "Powered by [Product]" appears on free tier outputs
- [ ] Basic SEO: title tags, meta descriptions, OG tags
- [ ] Error states are handled (API down, bad input, payment failure)
- [ ] PocketBase backups running on cron
- [ ] Domain on Cloudflare, SSL working
- [ ] Submitted to 5+ startup directories (BetaList, SaaSHub, AlternativeTo, etc.)

---

## What NOT to build

- Features that require moderation (user-generated content, comments, forums)
- Features that require manual approval or review
- Integrations with volatile APIs (social media APIs that change pricing/access)
- Admin dashboards beyond PocketBase's built-in admin
- Email-heavy features (transactional email is fine; newsletters are maintenance)
- Multi-tenant enterprise features
- Anything that requires you to be available

---

## Revenue math reference

At $9/month per user with Stripe:
- Stripe fee: $0.56
- API cost: ~$0.05
- Fixed costs: ~$0.75/month total (amortized domain)
- **Profit per user: ~$8.31**
- **Breakeven: 1 user**
- **50 users = $415/month profit**
- **100 users = $831/month profit**
- **200 users = $1,662/month profit**

---

## Sellability

When this product is ready to sell:
- Stripe dashboard shows verified revenue (buyers trust this)
- PocketBase is portable — single binary + SQLite file + env config
- No external service dependencies to transfer
- Cloudflare domain transfer is standard process
- List on Acquire.com, Microns.io, Tiny Acquisitions
- Expected multiple: 2.5–4× annual profit

---

*This document supersedes any conflicting instructions in project-specific SRDs. If something in the project SRD conflicts with this file, this file wins.*
