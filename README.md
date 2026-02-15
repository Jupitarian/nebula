# Mobile Offers Dashboard

A real-time dashboard that scrapes and displays the latest phone and wireless plan offers from **Mint Mobile**, **Visible**, and **Boost Mobile**.

## Features

- **Live scraping** from carrier websites with multi-source fallback
- **Refresh button** to pull the latest offers on demand
- **Card view** showing each carrier's plans, pricing, and features
- **Comparison view** with sortable table across all carriers
- **Filter and sort** plans by carrier and price
- **Promotions display** with badges and expiration dates
- **5-minute cache** to avoid excessive requests
- **Dark theme** dashboard UI

## Quick Start

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Architecture

```
nebula/
├── server.js              # Express server with caching
├── scrapers/
│   ├── utils.js           # Shared HTTP fetch with browser headers
│   ├── mint.js            # Mint Mobile scraper (multi-source)
│   ├── visible.js         # Visible scraper (multi-source)
│   └── boost.js           # Boost Mobile scraper (multi-source)
├── public/
│   ├── index.html         # Dashboard HTML
│   ├── styles.css         # Dark theme styles
│   └── app.js             # Frontend logic
├── package.json
└── README.md
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/offers` | Get all carrier offers (cached) |
| `GET /api/offers?refresh=true` | Force re-scrape from sources |
| `GET /api/offers/:carrier` | Get single carrier (`mint`, `visible`, `boost`) |

## Scraping Strategy

Each carrier scraper attempts multiple sources in order:

1. **Direct** - Fetch from the carrier's website with browser-like headers
2. **Aggregator** - Scrape comparison sites (WhistleOut, TechRadar, Tom's Guide)
3. **Fallback** - Return known plan data as a baseline

Carrier websites use bot protection (Cloudflare/WAF), so the scrapers gracefully fall back to alternative sources when direct access is blocked.

## Carriers Covered

- **Mint Mobile** - 4 plans on T-Mobile 5G/4G LTE (5GB, 15GB, 20GB, Unlimited)
- **Visible** - 3 plans on Verizon 5G/4G LTE (Visible, Visible+, Visible+ Pro)
- **Boost Mobile** - 5 plans on T-Mobile 5G/4G LTE (Unlimited, Unlimited+, Premium, Infinite Access)
