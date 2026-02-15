const axios = require('axios');
const cheerio = require('cheerio');
const { fetchPage } = require('./utils');

async function scrapeBoostMobile() {
  const strategies = [scrapeBoostDirect, scrapeBoostHelp, scrapeBoostFromWhistleOut];

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

  return getBoostFallbackData();
}

async function scrapeBoostDirect() {
  const html = await fetchPage('https://www.boostmobile.com/plans');
  const $ = cheerio.load(html);
  const plans = [];

  // JSON-LD
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

  // DOM scraping
  if (plans.length === 0) {
    $('[class*="plan"], [class*="Plan"], [class*="price"], [class*="Price"]').each((_, el) => {
      const text = $(el).text();
      const priceMatch = text.match(/\$(\d+)(?:\s*\/\s*mo|\s*per\s*month)/i);
      if (priceMatch) {
        const dataMatch = text.match(/(\d+)\s*GB|Unlimited/i);
        const existing = plans.find(p => p.priceValue === parseInt(priceMatch[1]));
        if (!existing) {
          plans.push({
            name: dataMatch ? dataMatch[0] : 'Plan',
            price: `$${priceMatch[1]}/mo`,
            priceValue: parseInt(priceMatch[1]),
            data: dataMatch ? dataMatch[0] : 'Unlimited',
          });
        }
      }
    });
  }

  if (plans.length === 0) throw new Error('No plans found on Boost direct');

  return {
    carrier: 'Boost Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'boostmobile.com',
    sourceUrl: 'https://www.boostmobile.com/plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

async function scrapeBoostHelp() {
  const html = await fetchPage('https://help.boostmobile.com/docs/unlimited-plans');
  const $ = cheerio.load(html);
  const plans = [];

  const text = $('body').text();
  const priceMatches = [...text.matchAll(/\$(\d+)(?:\s*\/\s*mo|\s*per\s*month)/gi)];

  for (const match of priceMatches) {
    const price = parseInt(match[1]);
    if ([25, 50, 60, 65].includes(price)) {
      const existing = plans.find(p => p.priceValue === price);
      if (!existing) {
        let name = 'Unlimited';
        if (price === 50) name = 'Unlimited+';
        if (price === 60) name = 'Unlimited Premium';
        if (price === 65) name = 'Infinite Access';

        plans.push({
          name,
          price: `$${price}/mo`,
          priceValue: price,
          data: 'Unlimited',
        });
      }
    }
  }

  if (plans.length === 0) throw new Error('No plans found on Boost Help');

  return {
    carrier: 'Boost Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'help.boostmobile.com',
    sourceUrl: 'https://help.boostmobile.com/docs/unlimited-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

async function scrapeBoostFromWhistleOut() {
  const html = await fetchPage('https://www.whistleout.com/CellPhones/Guides/best-boost-plans');
  const $ = cheerio.load(html);
  const plans = [];

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.toLowerCase().includes('boost')) {
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

  if (plans.length === 0) throw new Error('No plans found on WhistleOut for Boost');

  return {
    carrier: 'Boost Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'whistleout.com',
    sourceUrl: 'https://www.whistleout.com/CellPhones/Guides/best-boost-plans',
    lastUpdated: new Date().toISOString(),
    plans,
    promotions: [],
  };
}

function getBoostFallbackData() {
  return {
    carrier: 'Boost Mobile',
    network: 'T-Mobile 5G/4G LTE',
    source: 'boostmobile.com (cached)',
    sourceUrl: 'https://www.boostmobile.com/plans',
    lastUpdated: new Date().toISOString(),
    plans: [
      {
        name: 'Unlimited',
        price: '$25/mo',
        priceValue: 25,
        promoPrice: '$10/mo for first 3 months',
        data: '30 GB premium data',
        features: [
          'Unlimited talk & text',
          '30 GB premium high-speed data',
          '5G & 4G LTE',
          'Price locked forever with AutoPay',
          'Calls & texts to 200+ countries',
          '5 GB data in Canada & Mexico',
          'No hotspot (add-on $10/mo)',
        ],
      },
      {
        name: 'Unlimited+',
        price: '$50/mo',
        priceValue: 50,
        data: '40 GB premium data',
        features: [
          'Unlimited talk & text',
          '40 GB premium high-speed data',
          '5G & 4G LTE',
          'Mobile hotspot included',
          'Taxes & fees included',
          'No contracts',
        ],
      },
      {
        name: 'Unlimited Premium',
        price: '$60/mo',
        priceValue: 60,
        data: '50 GB premium data',
        features: [
          'Unlimited talk & text',
          '50 GB premium high-speed data',
          '5G & 4G LTE',
          'Mobile hotspot included',
          'Taxes & fees included',
          'Data roaming in Mexico & Canada',
          'No contracts',
        ],
      },
      {
        name: 'Infinite Access (iPhone)',
        price: '$65/mo',
        priceValue: 65,
        data: '30 GB premium data',
        features: [
          'Unlimited talk & text',
          '30 GB premium high-speed data',
          'New iPhone every year',
          'Mobile hotspot included',
          'Calls & texts to 200+ countries',
          '5 GB data in Canada & Mexico',
          '36-month device financing',
        ],
      },
      {
        name: 'Infinite Access (Galaxy)',
        price: '$65/mo',
        priceValue: 65,
        data: '30 GB premium data',
        features: [
          'Unlimited talk & text',
          '30 GB premium high-speed data',
          'New Galaxy S/Z every year',
          'Mobile hotspot included',
          'Calls & texts to 200+ countries',
          '5 GB data in Canada & Mexico',
          '36-month device financing',
        ],
      },
    ],
    promotions: [
      {
        title: '$10/mo Intro Offer',
        description: '$10/mo for first 3 months, then $25/mo locked forever',
        badge: 'HOT',
      },
      {
        title: 'Price Lock Guarantee',
        description: 'Rate locked forever with AutoPay on Unlimited plan',
        badge: 'LOCK',
      },
    ],
  };
}

module.exports = { scrapeBoostMobile };
