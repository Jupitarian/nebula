// State
let offersData = null;
let visibleCarriers = { mint: true, visible: true, boost: true };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showSkeletons();
  loadOffers(false);
});

// Load offers from API
async function loadOffers(forceRefresh) {
  const url = '/api/offers' + (forceRefresh ? '?refresh=true' : '');

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    offersData = await res.json();
    renderCards();
    renderCompareTable();
    updateTimestamp();
    showStatus('Offers loaded successfully', 'success');
  } catch (err) {
    showStatus('Failed to load offers: ' + err.message, 'error');
    showErrorCards();
  }
}

// Refresh button handler
function refreshOffers() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('loading');
  document.getElementById('refreshText').textContent = 'Scraping...';

  showStatus('Fetching latest offers from carrier websites...', 'info');
  showSkeletons();

  loadOffers(true).finally(() => {
    btn.classList.remove('loading');
    document.getElementById('refreshText').textContent = 'Refresh Offers';
  });
}

// Show status message
function showStatus(msg, type) {
  const bar = document.getElementById('statusBar');
  bar.style.display = 'block';
  bar.className = 'status-bar ' + type;
  document.getElementById('statusText').textContent = msg;

  if (type === 'success') {
    setTimeout(() => { bar.style.display = 'none'; }, 4000);
  }
}

// Update timestamp display
function updateTimestamp() {
  if (!offersData) return;
  const ts = new Date(offersData.timestamp);
  document.getElementById('lastUpdated').textContent =
    'Last updated: ' + ts.toLocaleString();
}

// View switching
function setView(view) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  document.getElementById('cardsView').classList.toggle('active', view === 'cards');
  document.getElementById('compareView').classList.toggle('active', view === 'compare');
}

// Show loading skeletons
function showSkeletons() {
  const grid = document.getElementById('carriersGrid');
  grid.innerHTML = ['mint', 'visible', 'boost'].map(() => `
    <div class="skeleton-card">
      <div class="skeleton-header"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  `).join('');
}

function showErrorCards() {
  const grid = document.getElementById('carriersGrid');
  grid.innerHTML = `
    <div class="carrier-card" style="grid-column: 1 / -1;">
      <div class="carrier-error">
        <p>Failed to load offers. Check your connection and try again.</p>
        <button class="retry-btn" onclick="refreshOffers()">Retry</button>
      </div>
    </div>
  `;
}

// Render carrier cards
function renderCards() {
  if (!offersData) return;
  const grid = document.getElementById('carriersGrid');

  const carrierKeys = ['mint', 'visible', 'boost'];
  const carrierLabels = {
    mint: 'Mint Mobile',
    visible: 'Visible',
    boost: 'Boost Mobile',
  };

  grid.innerHTML = carrierKeys.map(key => {
    const data = offersData.carriers[key];
    if (!data || data.error) {
      return renderErrorCard(carrierLabels[key], key, data?.error);
    }
    return renderCarrierCard(data, key);
  }).join('');
}

function renderCarrierCard(data, key) {
  const stale = data.stale ? '<span class="stale-badge">STALE</span>' : '';

  const promosHtml = (data.promotions && data.promotions.length > 0)
    ? `<div class="promos-strip">
        ${data.promotions.map(p => `
          <div class="promo-tag">
            ${p.badge ? `<span class="promo-badge ${p.badge}">${p.badge}</span>` : ''}
            <span>${escHtml(p.description)}</span>
            ${p.expires ? `<span class="promo-expires">Ends ${p.expires}</span>` : ''}
          </div>
        `).join('')}
       </div>`
    : '';

  const plansHtml = data.plans.map(plan => {
    const featuresHtml = (plan.features && plan.features.length > 0)
      ? `<ul class="plan-features">
          ${plan.features.map(f => `<li>${escHtml(f)}</li>`).join('')}
         </ul>`
      : '';

    const subPrice = [];
    if (plan.renewalPrice) subPrice.push(escHtml(plan.renewalPrice) + ' after');
    if (plan.annualPrice) subPrice.push('Annual: ' + escHtml(plan.annualPrice));
    if (plan.promoPrice) subPrice.push(escHtml(plan.promoPrice));

    return `
      <div class="plan-item">
        <div class="plan-top">
          <span class="plan-name">${escHtml(plan.name)}</span>
          <div class="plan-pricing">
            <div class="plan-price">${escHtml(plan.price)}</div>
            ${subPrice.length ? `<div class="plan-price-sub">${subPrice.join(' | ')}</div>` : ''}
          </div>
        </div>
        <div class="plan-data">${escHtml(plan.data || 'See carrier site')}</div>
        ${featuresHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="carrier-card">
      <div class="carrier-header ${key}">
        <div>
          <div class="carrier-name">${escHtml(data.carrier)} ${stale}</div>
          <div class="carrier-network">${escHtml(data.network || '')}</div>
        </div>
        <div class="carrier-source">
          Source: <a href="${escHtml(data.sourceUrl)}" target="_blank" rel="noopener">${escHtml(data.source)}</a>
        </div>
      </div>
      ${promosHtml}
      <div class="plans-list">
        ${plansHtml}
      </div>
    </div>
  `;
}

function renderErrorCard(name, key, errorMsg) {
  return `
    <div class="carrier-card">
      <div class="carrier-header ${key}">
        <div>
          <div class="carrier-name">${escHtml(name)}</div>
        </div>
      </div>
      <div class="carrier-error">
        <p>${escHtml(errorMsg || 'Failed to load offers')}</p>
        <button class="retry-btn" onclick="refreshOffers()">Retry</button>
      </div>
    </div>
  `;
}

// Compare table
function renderCompareTable() {
  if (!offersData) return;
  const tbody = document.getElementById('compareBody');

  const rows = [];
  const carrierKeys = ['mint', 'visible', 'boost'];

  carrierKeys.forEach(key => {
    const data = offersData.carriers[key];
    if (!data || data.error || !data.plans) return;

    data.plans.forEach(plan => {
      rows.push({
        carrier: data.carrier,
        carrierKey: key,
        name: plan.name,
        price: plan.price,
        priceValue: plan.priceValue || 999,
        data: plan.data || 'Unlimited',
        features: plan.features || [],
      });
    });
  });

  window._compareRows = rows;
  renderCompareRows(rows);
}

function renderCompareRows(rows) {
  const tbody = document.getElementById('compareBody');

  const filtered = rows.filter(r => visibleCarriers[r.carrierKey]);

  const sortVal = document.getElementById('sortSelect').value;
  if (sortVal === 'price-asc') {
    filtered.sort((a, b) => a.priceValue - b.priceValue);
  } else if (sortVal === 'price-desc') {
    filtered.sort((a, b) => b.priceValue - a.priceValue);
  } else {
    filtered.sort((a, b) => a.carrier.localeCompare(b.carrier));
  }

  tbody.innerHTML = filtered.map(row => {
    const topFeatures = row.features.slice(0, 4).join(', ');
    return `
      <tr>
        <td class="carrier-cell ${row.carrierKey}">${escHtml(row.carrier)}</td>
        <td>${escHtml(row.name)}</td>
        <td class="price-cell">${escHtml(row.price)}</td>
        <td>${escHtml(row.data)}</td>
        <td class="features-cell">${escHtml(topFeatures)}</td>
      </tr>
    `;
  }).join('');
}

function filterCompare(carrier, checked) {
  visibleCarriers[carrier] = checked;
  if (window._compareRows) {
    renderCompareRows(window._compareRows);
  }
}

function sortCompare() {
  if (window._compareRows) {
    renderCompareRows(window._compareRows);
  }
}

// Utility
function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
