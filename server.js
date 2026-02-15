const express = require('express');
const path = require('path');
const { scrapeMintMobile } = require('./scrapers/mint');
const { scrapeVisible } = require('./scrapers/visible');
const { scrapeBoostMobile } = require('./scrapers/boost');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory cache
let cache = {
  mint: { data: null, timestamp: null },
  visible: { data: null, timestamp: null },
  boost: { data: null, timestamp: null },
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(carrier) {
  return (
    cache[carrier].data &&
    cache[carrier].timestamp &&
    Date.now() - cache[carrier].timestamp < CACHE_TTL_MS
  );
}

// API: Get all offers
app.get('/api/offers', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';

  const results = await Promise.allSettled([
    fetchCarrier('mint', scrapeMintMobile, forceRefresh),
    fetchCarrier('visible', scrapeVisible, forceRefresh),
    fetchCarrier('boost', scrapeBoostMobile, forceRefresh),
  ]);

  const response = {
    timestamp: new Date().toISOString(),
    carriers: {},
  };

  const names = ['mint', 'visible', 'boost'];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      response.carriers[names[i]] = result.value;
    } else {
      response.carriers[names[i]] = {
        error: result.reason?.message || 'Failed to fetch',
        plans: [],
        lastUpdated: null,
      };
    }
  });

  res.json(response);
});

// API: Get single carrier
app.get('/api/offers/:carrier', async (req, res) => {
  const carrier = req.params.carrier;
  const forceRefresh = req.query.refresh === 'true';

  const scrapers = { mint: scrapeMintMobile, visible: scrapeVisible, boost: scrapeBoostMobile };

  if (!scrapers[carrier]) {
    return res.status(404).json({ error: 'Unknown carrier' });
  }

  try {
    const data = await fetchCarrier(carrier, scrapers[carrier], forceRefresh);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchCarrier(name, scraperFn, forceRefresh) {
  if (!forceRefresh && isCacheValid(name)) {
    return cache[name].data;
  }

  try {
    const data = await scraperFn();
    cache[name] = { data, timestamp: Date.now() };
    return data;
  } catch (err) {
    // If scrape fails but we have stale cache, return it
    if (cache[name].data) {
      return { ...cache[name].data, stale: true };
    }
    throw err;
  }
}

app.listen(PORT, () => {
  console.log(`Mobile Offers Dashboard running at http://localhost:${PORT}`);
});
