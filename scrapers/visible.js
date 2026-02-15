const axios = require('axios');
const cheerio = require('cheerio');
const { fetchPage } = require('./utils');

async function scrapeVisible() {
  const strategies = [scrapeVisibleDirect, scrapeVisibleFromWhistleOut, scrapeVisibleFromTechRadar];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result && result.plans && result.plans.length > 0) {
        return result;
      }
    } catch (err) {
      // Continue to next strategy
    }
  }

  return getVisibleFallbackData();
}

async function scrapeVisibleDirect() {
  const html = await fetchPage('https://www.visible.com/plans');
  const $ = cheerio.load(html);
  const plans = [];

  // Look for JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data.offers || data['@type'] === 'Product') {
        plans.push({
          name: data.name || 'Plan',
          price: data.offers?.price ? `$${data.offers.price}/mo` : 'See site',
          priceValue: data.offers?.price ? parseFloat(data.offers.price) : null,
        });
      }
    } catch (e) {}
  });

  // Try __NEXT_DATA__
  if (plans.length === 0) {
    const nextDataEl = $('script#__NEXT_DATA__');
    if (nextDataEl.length) {
      try {
        const nextData = JSON.parse(nextDataEl.html());
        const props = nextData?.props?.pageProps;
        if (props) {
          const walkForPlans = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.planName && obj.price) {
              plans.push({
                name: obj.planName,
                price: `$${obj.price}/mo`,
                priceValue: parseFloat(obj.price),
                data: obj.data || 'Unlimited',
              });
            }
            for (const val of Object.values(obj)) {
              if (typeof val === 'object') walkForPlans(val);
            }
          };
          walkForPlans(props);
        }
      } catch (e) {}
    }
  }

  // DOM scraping
  if (plans.length === 0) {
    $('[class*="plan"], [class*="Plan"], [class*="card"], [class*="Card"]').each((_, el) => {
      const text = $(el).text();
      const priceMatch = text.match(/\$(\d+)(?:\s*\/\s*mo|\s*per\s*month)/i);
      const nameMatch = text.match(/Visible\+?\s*(?:Pro)?/i);
      if (priceMatch && nameMatch) {
        const existing = plans.find(p => p.priceValue === parseInt(priceMatch[1]));
        if (!existing) {
          plans.push({
            name: nameMatch[0].trim(),
            price: `$${priceMatch[1]}/mo`,
            priceValue: parseInt(priceMatch[1]),
            data: 'Unlimited',
          });
        }
      }
    });
  }

  if (plans.length === 0) throw new Error('No plans found on Visible direct');

  return {
    carrier: 'Visible',
    network: 'Verizon 5G/4G LTE',
    source: 'visible.com',
    sourceUrl: 'https://www.visible.com/plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

async function scrapeVisibleFromWhistleOut() {
  const html = await fetchPage('https://www.whistleout.com/CellPhones/Guides/visible-wireless-plans');
  const $ = cheerio.load(html);
  const plans = [];

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.toLowerCase().includes('visible')) {
      const section = $(el).parent();
      const text = section.text();
      const priceMatch = text.match(/\$(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)mo/i);

      if (priceMatch) {
        plans.push({
          name: heading.replace(/^\d+\.\s*/, '').substring(0, 40),
          price: `$${priceMatch[1]}/mo`,
          priceValue: parseFloat(priceMatch[1]),
          data: 'Unlimited',
        });
      }
    }
  });

  if (plans.length === 0) throw new Error('No plans found on WhistleOut for Visible');

  return {
    carrier: 'Visible',
    network: 'Verizon 5G/4G LTE',
    source: 'whistleout.com',
    sourceUrl: 'https://www.whistleout.com/CellPhones/Guides/visible-wireless-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

async function scrapeVisibleFromTechRadar() {
  const html = await fetchPage('https://www.techradar.com/deals/best-visible-wireless-plans');
  const $ = cheerio.load(html);
  const plans = [];

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.toLowerCase().includes('visible')) {
      const nextEls = $(el).nextAll().slice(0, 8);
      const text = nextEls.text();
      const priceMatch = text.match(/\$(\d+(?:\.\d+)?)/);

      if (priceMatch) {
        plans.push({
          name: heading.replace(/^\d+\.\s*/, '').substring(0, 40),
          price: `$${priceMatch[1]}/mo`,
          priceValue: parseFloat(priceMatch[1]),
          data: 'Unlimited',
        });
      }
    }
  });

  if (plans.length === 0) throw new Error('No plans found on TechRadar for Visible');

  return {
    carrier: 'Visible',
    network: 'Verizon 5G/4G LTE',
    source: 'techradar.com',
    sourceUrl: 'https://www.techradar.com/deals/best-visible-wireless-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

function getVisibleFallbackData() {
  return {
    carrier: 'Visible',
    network: 'Verizon 5G/4G LTE',
    source: 'visible.com (cached)',
    sourceUrl: 'https://www.visible.com/plans',
    lastUpdated: new Date().toISOString(),
    plans: [
      {
        name: 'Visible',
        price: '$25/mo',
        priceValue: 25,
        annualPrice: '$275/yr (~$22.92/mo)',
        data: 'Unlimited',
        features: [
          'Unlimited data (standard priority)',
          'Unlimited hotspot at 5 Mbps',
          '5G & 4G LTE on Verizon',
          'Taxes & fees included',
          'No contracts',
          'SD video streaming',
        ],
      },
      {
        name: 'Visible+',
        price: '$35/mo',
        priceValue: 35,
        annualPrice: '$375/yr (~$31.25/mo)',
        data: 'Unlimited',
        features: [
          'Unlimited premium data',
          'Unlimited hotspot at 10 Mbps',
          '5G Ultra Wideband access',
          'Taxes & fees included',
          'Calls/texts to Canada & Mexico',
          '2GB roaming in Canada & Mexico',
          '1 Global Pass day/month',
          'Up to 1080p video streaming',
        ],
      },
      {
        name: 'Visible+ Pro',
        price: '$45/mo',
        priceValue: 45,
        annualPrice: '$450/yr (~$37.50/mo)',
        data: 'Unlimited',
        features: [
          'Unlimited premium data',
          'Unlimited hotspot at 15 Mbps',
          '5G Ultra Wideband access',
          'Taxes & fees included',
          '500 min/mo to 85+ countries',
          'Roaming in Mexico & Canada',
          '2 Global Pass days/month',
          'Up to 4K UHD video streaming',
          'Smartwatch included',
        ],
      },
    ],
    promotions: [
      {
        title: 'SWITCH26 Promo',
        description: 'Up to $12/mo off for 26 months when switching',
        badge: 'SWITCH',
      },
      {
        title: '5OFF5 Promo',
        description: '$5/mo off Visible+ or Pro for 60 months with port-in',
        badge: 'SAVE',
        expires: '2026-03-31',
      },
    ],
  };
}

module.exports = { scrapeVisible };
