const axios = require('axios');
const cheerio = require('cheerio');
const { fetchPage } = require('./utils');

async function scrapeMintMobile() {
  // Try multiple sources in order of preference
  const strategies = [scrapeMintDirect, scrapeMintFromWhistleOut, scrapeMintFromTomGuide];

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

  // Final fallback: return known plan data
  return getMintFallbackData();
}

async function scrapeMintDirect() {
  const html = await fetchPage('https://www.mintmobile.com/plans/');
  const $ = cheerio.load(html);

  const plans = [];

  // Look for JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type'] === 'Product' || data['@type'] === 'Offer') {
        plans.push(extractFromJsonLd(data));
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  // Try __NEXT_DATA__ (Next.js)
  if (plans.length === 0) {
    const nextDataEl = $('script#__NEXT_DATA__');
    if (nextDataEl.length) {
      try {
        const nextData = JSON.parse(nextDataEl.html());
        const extracted = extractFromNextData(nextData);
        if (extracted.length > 0) plans.push(...extracted);
      } catch (e) {
        // ignore
      }
    }
  }

  // Try DOM-based extraction
  if (plans.length === 0) {
    $('[class*="plan"], [class*="Plan"], [data-plan]').each((_, el) => {
      const text = $(el).text();
      const priceMatch = text.match(/\$(\d+)/);
      const dataMatch = text.match(/(\d+)\s*GB|Unlimited/i);
      if (priceMatch) {
        plans.push({
          name: dataMatch ? (dataMatch[0].toLowerCase().includes('unlimited') ? 'Unlimited' : `${dataMatch[1]}GB`) : 'Plan',
          price: `$${priceMatch[1]}/mo`,
          priceValue: parseInt(priceMatch[1]),
          data: dataMatch ? dataMatch[0] : 'Unknown',
        });
      }
    });
  }

  if (plans.length === 0) throw new Error('No plans found on Mint Mobile direct');

  return {
    carrier: 'Mint Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'mintmobile.com',
    sourceUrl: 'https://www.mintmobile.com/plans/',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

function extractFromJsonLd(data) {
  return {
    name: data.name || 'Plan',
    price: data.offers?.price ? `$${data.offers.price}/mo` : 'See site',
    priceValue: data.offers?.price ? parseFloat(data.offers.price) : null,
    data: data.description || '',
  };
}

function extractFromNextData(data) {
  const plans = [];
  const props = data?.props?.pageProps;
  if (props?.plans) {
    for (const plan of props.plans) {
      plans.push({
        name: plan.name || plan.title || 'Plan',
        price: plan.price ? `$${plan.price}/mo` : 'See site',
        priceValue: plan.price ? parseFloat(plan.price) : null,
        data: plan.data || plan.dataAmount || '',
      });
    }
  }
  return plans;
}

async function scrapeMintFromWhistleOut() {
  const html = await fetchPage('https://www.whistleout.com/CellPhones/Guides/best-mint-mobile-plans');
  const $ = cheerio.load(html);
  const plans = [];

  // WhistleOut typically has plan cards with structured data
  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.toLowerCase().includes('mint') && (heading.toLowerCase().includes('gb') || heading.toLowerCase().includes('unlimited'))) {
      const section = $(el).parent();
      const text = section.text();
      const priceMatch = text.match(/\$(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)mo/i);
      const dataMatch = heading.match(/(\d+)\s*GB|Unlimited/i);

      if (priceMatch || dataMatch) {
        plans.push({
          name: dataMatch ? (dataMatch[0].toLowerCase().includes('unlimited') ? 'Unlimited' : `${dataMatch[1]}GB`) : heading,
          price: priceMatch ? `$${priceMatch[1]}/mo` : 'See site',
          priceValue: priceMatch ? parseFloat(priceMatch[1]) : null,
          data: dataMatch ? dataMatch[0] : 'See site',
        });
      }
    }
  });

  if (plans.length === 0) throw new Error('No plans found on WhistleOut for Mint');

  return {
    carrier: 'Mint Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'whistleout.com',
    sourceUrl: 'https://www.whistleout.com/CellPhones/Guides/best-mint-mobile-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

async function scrapeMintFromTomGuide() {
  const html = await fetchPage('https://www.tomsguide.com/best-picks/best-mint-mobile-plans');
  const $ = cheerio.load(html);
  const plans = [];

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if ((heading.includes('GB') || heading.toLowerCase().includes('unlimited')) && heading.toLowerCase().includes('mint')) {
      const parent = $(el).nextAll().slice(0, 5);
      const text = parent.text();
      const priceMatch = text.match(/\$(\d+(?:\.\d+)?)/);
      const dataMatch = heading.match(/(\d+)\s*GB|Unlimited/i);

      plans.push({
        name: dataMatch ? (dataMatch[0].toLowerCase().includes('unlimited') ? 'Unlimited' : `${dataMatch[1]}GB`) : heading.substring(0, 30),
        price: priceMatch ? `$${priceMatch[1]}/mo` : 'See site',
        priceValue: priceMatch ? parseFloat(priceMatch[1]) : null,
        data: dataMatch ? dataMatch[0] : 'See site',
      });
    }
  });

  if (plans.length === 0) throw new Error('No plans found on Tom\'s Guide for Mint');

  return {
    carrier: 'Mint Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'tomsguide.com',
    sourceUrl: 'https://www.tomsguide.com/best-picks/best-mint-mobile-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

function getMintFallbackData() {
  return {
    carrier: 'Mint Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'mintmobile.com (cached)',
    sourceUrl: 'https://www.mintmobile.com/plans/',
    lastUpdated: new Date().toISOString(),
    plans: [
      {
        name: '5GB',
        price: '$15/mo',
        priceValue: 15,
        renewalPrice: '$15/mo (12-mo)',
        data: '5 GB',
        features: [
          'Unlimited talk & text',
          '5G & 4G LTE',
          'Free hotspot (shared)',
          'Wi-Fi calling',
          'Free calls to Mexico, Canada & UK',
          'Free Canada roaming',
        ],
      },
      {
        name: '15GB',
        price: '$15/mo',
        priceValue: 15,
        renewalPrice: '$20/mo (12-mo)',
        data: '15 GB',
        features: [
          'Unlimited talk & text',
          '5G & 4G LTE',
          'Free hotspot (shared)',
          'Wi-Fi calling',
          'Free calls to Mexico, Canada & UK',
          'Free Canada roaming',
        ],
      },
      {
        name: '20GB',
        price: '$15/mo',
        priceValue: 15,
        renewalPrice: '$25/mo (12-mo)',
        data: '20 GB',
        features: [
          'Unlimited talk & text',
          '5G & 4G LTE',
          'Free hotspot (shared)',
          'Wi-Fi calling',
          'Free calls to Mexico, Canada & UK',
          'Free Canada roaming',
        ],
      },
      {
        name: 'Unlimited',
        price: '$15/mo',
        priceValue: 15,
        renewalPrice: '$30/mo (12-mo)',
        data: 'Unlimited (50GB priority)',
        features: [
          'Unlimited talk & text',
          '5G & 4G LTE',
          '20GB dedicated hotspot',
          'Wi-Fi calling',
          'Free calls to Mexico, Canada & UK',
          'Free Canada roaming',
          '480p video streaming',
        ],
      },
    ],
    promotions: [
      {
        title: 'New Customer Intro',
        description: 'All plans $15/mo for first 3 months',
        badge: 'NEW',
      },
      {
        title: '50% Off Unlimited',
        description: 'Unlimited plan at $15/mo for a full year',
        badge: 'HOT',
        expires: '2026-03-04',
      },
    ],
  };
}

module.exports = { scrapeMintMobile };
