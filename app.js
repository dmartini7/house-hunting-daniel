/* ── HOUSE HUNTING — DANIEL & ANA 2026 ──────────────────────────────────── */

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const KEY_LOCATIONS = [
  { name: 'Mindiola Soccer Park',   addr: 'Mindiola Park, Waukesha, WI',         icon: '⚽' },
  { name: 'Mosh Performance',       addr: 'Mosh Performance, Franklin, WI',       icon: '💪' },
  { name: 'Pewaukee Beach',         addr: 'Pewaukee Beach, Pewaukee, WI',          icon: '🏖️' },
];

const STATUS_LABELS = {
  active:  'Active',
  offer:   'Offer Made',
  pending: 'Pending',
  passed:  'Passed',
  closed:  'Closed ✓',
};

const REPAIR_ITEMS = [
  { key: 'roof',          label: 'Roof',              icon: '🏠' },
  { key: 'hvac',          label: 'HVAC / Furnace',    icon: '🌡️' },
  { key: 'waterHeater',   label: 'Water Heater',      icon: '💧' },
  { key: 'windows',       label: 'Windows',           icon: '🪟' },
  { key: 'electrical',    label: 'Electrical',        icon: '⚡' },
  { key: 'plumbing',      label: 'Plumbing',          icon: '🔧' },
  { key: 'foundation',    label: 'Foundation / Basement', icon: '🏗️' },
  { key: 'kitchen',       label: 'Kitchen',           icon: '🍳' },
  { key: 'bathrooms',     label: 'Bathrooms',         icon: '🚿' },
  { key: 'flooring',      label: 'Flooring',          icon: '🪵' },
  { key: 'exterior',      label: 'Exterior / Siding', icon: '🏘️' },
  { key: 'drivewayGarage',label: 'Driveway / Garage', icon: '🚗' },
];

const RESEARCH_LINKS = (address) => {
  const q = encodeURIComponent(address);
  return [
    { icon: '🎓', label: 'School Ratings (Niche)',  url: `https://www.niche.com/places-to-live/search/best-places-for-families/?q=${q}` },
    { icon: '🏫', label: 'GreatSchools',            url: `https://www.greatschools.org/search/search.page?q=${q}` },
    { icon: '🔒', label: 'Crime Map (SpotCrime)',    url: `https://spotcrime.com/` },
    { icon: '🚶', label: 'Walk Score',               url: `https://www.walkscore.com/score/loc/lat=43.01/lng=-88.23/` },
    { icon: '🌊', label: 'FEMA Flood Zone',          url: `https://msc.fema.gov/portal/home` },
    { icon: '🔍', label: 'Neighborhood Scout',       url: `https://www.neighborhoodscout.com/` },
    { icon: '💰', label: 'WI Property Tax Lookup',   url: `https://www.wicourts.gov/` },
    { icon: '📊', label: 'County Assessor (WI)',     url: `https://www.co.waukesha.wi.us/` },
  ];
};

const RENTAL_RESEARCH_LINKS = (address) => {
  const q = encodeURIComponent(address);
  return [
    { icon: '📊', label: 'Zillow Rent Estimate',       url: `https://www.zillow.com/rental-manager/price-my-rental/` },
    { icon: '📈', label: 'Rentometer',                  url: `https://www.rentometer.com/` },
    { icon: '🏢', label: 'Apartments.com Comps',        url: `https://www.apartments.com/` },
    { icon: '📱', label: 'Facebook Marketplace Rentals',url: `https://www.facebook.com/marketplace/rentals/` },
    { icon: '📋', label: 'Craigslist Milwaukee',        url: `https://milwaukee.craigslist.org/search/apa` },
  ];
};

// ── LISTING FETCH & PARSE ─────────────────────────────────────────────────────

function detectPlatform(url) {
  if (url.includes('zillow.com'))   return 'Zillow';
  if (url.includes('redfin.com'))   return 'Redfin';
  if (url.includes('realtor.com'))  return 'Realtor.com';
  if (url.includes('homes.com'))    return 'Homes.com';
  if (url.includes('trulia.com'))   return 'Trulia';
  if (url.includes('flexmls.com'))  return 'FlexMLS';
  if (url.includes('mlsfeeds'))     return 'MLS Feed';
  if (url.includes('showmojo.com')) return 'ShowMojo';
  return 'MLS listing';
}

function isMlsFeedUrl(url) {
  return url.includes('flexmls.com') || url.includes('newsfeed') ||
         url.includes('mlsfeeds') || url.includes('notification_id');
}

// Synchronous — extracts what we can from the URL slug alone
function extractFromURL(url) {
  // Zillow: /homedetails/123-Main-St-Waukesha-WI-53188/12345_zpid/
  const zMatch = url.match(/zillow\.com\/homedetails\/([^/?]+)/);
  if (zMatch) {
    const parts  = zMatch[1].split('-');
    const zpidI  = parts.findIndex(p => /^\d{7,}$/.test(p));
    const slug   = zpidI >= 0 ? parts.slice(0, zpidI) : parts;
    const stateI = slug.findIndex(p => /^[A-Z]{2}$/.test(p));
    const street = stateI > 1 ? slug.slice(0, stateI - 1).join(' ') : slug.slice(0, -2).join(' ');
    const state  = stateI >= 0 ? slug[stateI] : '';
    const city   = stateI > 0  ? slug[stateI - 1] : '';
    return { address: [street, city, state].filter(Boolean).join(', ') };
  }
  // Redfin: /WI/Waukesha/123-Main-St-53188/home/
  const rfMatch = url.match(/redfin\.com\/([A-Z]{2})\/([^/]+)\/([^/]+)\/home/);
  if (rfMatch) {
    const st  = rfMatch[1];
    const cty = rfMatch[2].replace(/-/g, ' ');
    const str = rfMatch[3].replace(/-\d{5}$/, '').replace(/-/g, ' ');
    return { address: `${str}, ${cty}, ${st}` };
  }
  // Realtor: /realestateandhomes-detail/123-Main-St_Waukesha_WI_53188
  const rlMatch = url.match(/realtor\.com\/realestateandhomes-detail\/([^?/]+)/);
  if (rlMatch) {
    return { address: rlMatch[1].replace(/_/g, ', ').replace(/-/g, ' ') };
  }
  return {};
}

// Async — fetches page via proxy and extracts structured data
async function fetchListingData(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 14000);
    const res = await fetch(proxyUrl, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const html = json.contents || '';
    if (!html || html.length < 500) return null;
    if (url.includes('zillow.com'))  return parseZillow(html)  || parseGenericMeta(html);
    if (url.includes('redfin.com'))  return parseRedfin(html)  || parseGenericMeta(html);
    if (url.includes('realtor.com')) return parseRealtor(html) || parseGenericMeta(html);
    return parseGenericMeta(html);
  } catch(e) { return null; }
}

const PROP_TYPE_MAP = {
  SINGLE_FAMILY: 'single', SINGLE_FAMILY_RESIDENCE: 'single',
  MULTI_FAMILY: 'duplex', MULTI_FAMILY_2_4: 'duplex',
  DUPLEX: 'duplex', TRIPLEX: 'triplex',
  QUADRUPLEX: 'fourplex', QUADPLEX: 'fourplex',
  CONDO: 'single', TOWNHOUSE: 'single', MOBILE: 'single',
};

function mapZillowProp(p) {
  if (!p || !p.streetAddress) return null;
  const price = Number(p.price || p.listPrice || p.hdpData?.homeInfo?.price || 0);
  const beds  = Number(p.bedrooms  || p.beds  || 0);
  const baths = Number(p.bathrooms || p.baths || 0);
  const sqft  = Number(p.livingArea || p.squareFeet || p.resoFacts?.livingArea || 0);
  const year  = Number(p.yearBuilt  || p.resoFacts?.yearBuilt || 0);
  const type  = PROP_TYPE_MAP[p.homeType] || PROP_TYPE_MAP[p.propertyType] || 'duplex';
  const addr  = [p.streetAddress, p.city, p.state, p.zipcode].filter(Boolean).join(', ');
  const taxR  = p.propertyTaxRate || 0;

  const result = { address: addr, price, beds, baths, sqft, yearBuilt: year, propertyType: type };
  if (taxR && price) result.taxAnnual = Math.round(price * taxR / 100);
  if (p.zestimate)     result.zestimate = p.zestimate;
  if (p.daysOnZillow)  result.dom = p.daysOnZillow;
  if (p.description)   result.notes = p.description.slice(0, 600);
  const schools = p.schools || p.schoolsSummary?.schools;
  if (schools?.[0]?.name) result.schoolDistrict = schools[0].name;
  const numU = numUnitsForType(type);
  result.units = Array.from({ length: numU }, (_, i) => ({
    label: i === 0 ? 'Unit 1 (Owner)' : `Unit ${i+1} (Rental)`,
    beds:  i === 0 ? Math.ceil(beds / numU) : Math.floor(beds / numU),
    baths: i === 0 ? Math.ceil(baths / numU) : Math.floor(baths / numU),
    sqft:  Math.round((sqft || 0) / numU),
    rent: 0,
  }));
  return result;
}

function parseZillow(html) {
  try {
    const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    const nd = JSON.parse(match[1]);

    // Path 1: gdpClientCache (common in Zillow)
    try {
      const gdpStr = nd?.props?.pageProps?.componentProps?.gdpClientCache;
      if (gdpStr) {
        const gdp = JSON.parse(gdpStr);
        const key = Object.keys(gdp).find(k => gdp[k]?.property?.streetAddress);
        if (key) return mapZillowProp(gdp[key].property);
      }
    } catch(e) {}

    // Path 2: initialReduxState
    try {
      const irs = nd?.props?.pageProps?.initialReduxState;
      const prop = irs?.gdp?.building || irs?.homeDetails?.building;
      if (prop?.streetAddress) return mapZillowProp(prop);
    } catch(e) {}

    // Path 3: flat pageProps
    try {
      const pp = nd?.props?.pageProps;
      const prop = pp?.building || pp?.property || pp?.initialData?.property;
      if (prop?.streetAddress) return mapZillowProp(prop);
    } catch(e) {}

    return null;
  } catch(e) { return null; }
}

function parseRedfin(html) {
  try {
    const m = html.match(/root\.__reactData\s*=\s*({[\s\S]*?});\s*(?:window|root|<)/);
    if (!m) return parseGenericMeta(html);
    const data = JSON.parse(m[1]);
    const l = data?.root?.listing || data?.listing || data?.homeData;
    if (!l) return parseGenericMeta(html);
    return {
      address:      [l.streetLine?.value, l.city, l.state, l.zip].filter(Boolean).join(', '),
      price:        l.price?.value    || l.listingPrice?.value,
      beds:         l.beds,
      baths:        l.baths,
      sqft:         l.sqFt?.value,
      yearBuilt:    l.yearBuilt?.value,
      propertyType: 'duplex',
    };
  } catch(e) { return parseGenericMeta(html); }
}

function parseRealtor(html) {
  try {
    const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return parseGenericMeta(html);
    const nd = JSON.parse(m[1]);
    const p = nd?.props?.pageProps?.property || nd?.props?.pageProps?.listing;
    if (!p) return parseGenericMeta(html);
    return {
      address: [p.location?.address?.line, p.location?.address?.city, p.location?.address?.state_code, p.location?.address?.postal_code].filter(Boolean).join(', '),
      price:   p.list_price || p.price,
      beds:    p.description?.beds,
      baths:   p.description?.baths_consolidated || p.description?.baths,
      sqft:    p.description?.sqft,
      yearBuilt: p.description?.year_built,
    };
  } catch(e) { return parseGenericMeta(html); }
}

function parseGenericMeta(html) {
  try {
    const get = (re) => html.match(re)?.[1]?.trim();
    const price = Number(get(/itemprop="price"\s+content="([^"]+)"/) ||
                         get(/property="product:price:amount"\s+content="([^"]+)"/) || 0);
    const desc  = get(/property="og:description"\s+content="([^"]+)"/);
    if (!price) return null;
    return { price, notes: desc ? desc.slice(0, 400) : '' };
  } catch(e) { return null; }
}

// ── STATE ─────────────────────────────────────────────────────────────────────

let state = {
  properties: [],
  activeId: null,
  view: 'dashboard',   // 'dashboard' | 'property' | 'compare'
  activeTab: 'overview',
  filterStatus: 'all',
  compareMode: false,
  compareIds: [],
  editingId: null,
  modalStep: 0,
};

// ── STORAGE ───────────────────────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem('hh_daniel_2026');
    if (raw) state.properties = JSON.parse(raw);
  } catch(e) { state.properties = []; }
}

function save() {
  localStorage.setItem('hh_daniel_2026', JSON.stringify(state.properties));
}

// ── ID / DATE HELPERS ─────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function fmt$(n) { if (!n && n !== 0) return '—'; return '$' + Math.round(n).toLocaleString(); }
function fmtK(n) { if (!n && n !== 0) return '—'; if (n >= 1000) return '$' + (n/1000).toFixed(0) + 'K'; return fmt$(n); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function stars(n) { return '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0)); }
function mapUrl(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

// ── FINANCIAL CALCULATIONS ────────────────────────────────────────────────────

function calcMortgage(price, downPct, ratePct, termYrs) {
  const principal = price * (1 - downPct / 100);
  const r = ratePct / 100 / 12;
  const n = termYrs * 12;
  if (r === 0 || !r) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcExpenses(p) {
  const mortgage  = calcMortgage(p.price || 0, p.downPct || 20, p.rate || 7, p.term || 30);
  const taxes     = (p.taxAnnual || 0) / 12;
  const insurance = (p.insAnnual || 0) / 12;
  const hoa       = p.hoaMonthly || 0;
  const maint     = (p.price || 0) * (p.maintPct || 1) / 100 / 12;
  const total     = mortgage + taxes + insurance + hoa + maint;
  return { mortgage, taxes, insurance, hoa, maint, total };
}

function calcRepairTotal(p) {
  if (!p.repairs) return 0;
  let sum = 0;
  for (const item of REPAIR_ITEMS) {
    sum += Number(p.repairs[item.key]?.cost || 0);
  }
  if (p.repairs.other) p.repairs.other.forEach(o => sum += Number(o.cost || 0));
  return sum;
}

function calcCashFlow(p) {
  const exp = calcExpenses(p);

  // Rental units income (units index 1+)
  const units = p.units || [];
  const rentalUnits = units.slice(1);
  const grossRent   = rentalUnits.reduce((s, u) => s + (Number(u.rent) || 0), 0);
  const vacancyAmt  = grossRent * (p.vacancyPct || 5) / 100;
  const netRent     = grossRent - vacancyAmt;
  const currentCF   = netRent - exp.total;

  // Full investment (all units rented, they've moved out)
  const allGross   = units.reduce((s, u) => s + (Number(u.rent) || 0), 0);
  const allNetRent = allGross * (1 - (p.vacancyPct || 5) / 100);
  const fullCF     = allNetRent - exp.total;

  // Cash on cash
  const downAmt     = (p.price || 0) * (p.downPct || 20) / 100;
  const closing     = p.closingCosts || 0;
  const repairs     = calcRepairTotal(p);
  const totalIn     = downAmt + closing + repairs;
  const coc         = totalIn > 0 ? (currentCF * 12) / totalIn * 100 : 0;
  const cocFull     = totalIn > 0 ? (fullCF * 12) / totalIn * 100 : 0;

  return { exp, grossRent, netRent, currentCF, allGross, allNetRent, fullCF, downAmt, totalIn, coc, cocFull };
}

function calcProjection(p, years = 5) {
  const rows = [];
  const exp    = calcExpenses(p);
  const units  = p.units || [];
  const appreciation = 0.04; // 4% annual
  const rentIncrease = 0.03; // 3% annual
  let price      = p.price || 0;
  let loanBal    = price * (1 - (p.downPct || 20) / 100);
  const r        = (p.rate || 7) / 100 / 12;
  const n        = (p.term || 30) * 12;
  const payment  = calcMortgage(p.price || 0, p.downPct || 20, p.rate || 7, p.term || 30);
  let rent       = units.slice(1).reduce((s, u) => s + (Number(u.rent) || 0), 0);

  for (let yr = 1; yr <= years; yr++) {
    price    *= (1 + appreciation);
    rent     *= (1 + rentIncrease);
    // loan balance after yr * 12 payments
    for (let mo = 0; mo < 12; mo++) {
      const interest = loanBal * r;
      const prin     = payment - interest;
      loanBal = Math.max(0, loanBal - prin);
    }
    const equity  = price - loanBal;
    const netRent = rent * (1 - (p.vacancyPct || 5) / 100);
    const annualCF = (netRent - exp.total) * 12;
    rows.push({ yr, price, loanBal, equity, annualCF });
  }
  return rows;
}

// ── DEFAULT PROPERTY ──────────────────────────────────────────────────────────

function defaultProperty(url) {
  const repairDefault = {};
  REPAIR_ITEMS.forEach(r => { repairDefault[r.key] = { condition: 'good', age: '', cost: 0, notes: '' }; });
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    rating: 0,
    url: url || '',
    address: '',
    propertyType: 'duplex',
    yearBuilt: '',
    beds: '',
    baths: '',
    sqft: '',
    lot: '',
    dom: '',
    price: 0,
    downPct: 5,
    rate: 7.0,
    term: 30,
    taxAnnual: 0,
    insAnnual: 0,
    hoaMonthly: 0,
    maintPct: 1,
    closingCosts: 0,
    units: [
      { label: 'Unit 1 (Owner)', beds: '', baths: '', sqft: '', rent: 0 },
      { label: 'Unit 2 (Rental)', beds: '', baths: '', sqft: '', rent: 0 },
    ],
    vacancyPct: 5,
    repairs: { ...repairDefault, other: [] },
    comps: [],
    schoolDistrict: '',
    locationNotes: '',
    pros: '',
    cons: '',
    notes: '',
  };
}

function numUnitsForType(type) {
  return { duplex: 2, triplex: 3, fourplex: 4, single: 1 }[type] || 2;
}

// ── RENDER HELPERS ────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }
function show(id) { el(id).classList.remove('hidden'); }
function hide(id) { el(id).classList.add('hidden'); }
function setHTML(id, html) { const e = el(id); if (e) e.innerHTML = html; }
function setText(id, txt) { const e = el(id); if (e) e.textContent = txt; }

function showToast(msg, type = 'success') {
  const t = el('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function statusBadgeHTML(status) {
  return `<span class="status-badge s-${status}">${STATUS_LABELS[status] || status}</span>`;
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────

function renderSidebar() {
  const filtered = state.filterStatus === 'all'
    ? state.properties
    : state.properties.filter(p => p.status === state.filterStatus);

  el('prop-count').textContent = state.properties.length;
  const list = el('prop-list');

  if (filtered.length === 0) {
    list.innerHTML = `<div class="sidebar-empty" id="sidebar-empty">
      <div style="font-size:2.2rem;margin-bottom:8px">${state.properties.length === 0 ? '🏘️' : '🔍'}</div>
      <p>${state.properties.length === 0 ? 'No properties yet.<br/>Paste a listing URL above.' : 'No properties match this filter.'}</p>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(p => {
    const cf = calcCashFlow(p);
    const repTotal = calcRepairTotal(p);
    const isActive = p.id === state.activeId;
    const isCompSel = state.compareIds.includes(p.id);
    const shortAddr = p.address ? p.address.split(',')[0] : '(No address)';
    const cfStr = cf.currentCF !== 0 ? (cf.currentCF > 0 ? `+${fmt$(cf.currentCF)}/mo` : `${fmt$(cf.currentCF)}/mo`) : '';

    return `<div class="prop-card ${isActive ? 'active' : ''} ${isCompSel ? 'compare-selected' : ''}"
              data-id="${p.id}" onclick="clickPropCard('${p.id}')">
      ${state.compareMode ? `<input type="checkbox" class="pc-compare-cb" ${isCompSel ? 'checked' : ''} onchange="toggleCompare('${p.id}', event)" />` : ''}
      <div class="pc-top">
        <span class="pc-address">${shortAddr}</span>
        <span class="pc-price">${p.price ? fmtK(p.price) : '—'}</span>
      </div>
      <div class="pc-meta">
        ${p.propertyType ? `<span class="pc-chip">${p.propertyType}</span>` : ''}
        ${p.beds ? `<span class="pc-chip">${p.beds}bd/${p.baths}ba</span>` : ''}
        ${p.sqft ? `<span class="pc-chip">${Number(p.sqft).toLocaleString()} sf</span>` : ''}
        ${repTotal > 0 ? `<span class="pc-chip">🔧 ${fmtK(repTotal)}</span>` : ''}
      </div>
      <div class="pc-bottom">
        <span class="pc-stars">${stars(p.rating)}</span>
        ${statusBadgeHTML(p.status)}
      </div>
    </div>`;
  }).join('');
}

function clickPropCard(id) {
  if (state.compareMode) return;
  state.activeId = id;
  state.view = 'property';
  renderAll();
}

function toggleCompare(id, e) {
  e.stopPropagation();
  if (state.compareIds.includes(id)) {
    state.compareIds = state.compareIds.filter(x => x !== id);
  } else {
    state.compareIds.push(id);
  }
  renderSidebar();
  if (state.view === 'compare') renderCompare();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

function renderDashboard() {
  const ps = state.properties;
  el('hs-total').textContent  = ps.length;
  el('hs-active').textContent = ps.filter(p => p.status === 'active').length;
  el('hs-offers').textContent = ps.filter(p => p.status === 'offer').length;

  const prices = ps.filter(p => p.price > 0).map(p => p.price);
  el('hs-avg').textContent = prices.length ? fmtK(prices.reduce((a, b) => a + b, 0) / prices.length) : '—';

  const grid = el('dashboard-grid');
  if (ps.length === 0) {
    grid.innerHTML = `<div class="add-card" id="add-first-card">
      <div class="add-card-icon">+</div>
      <div class="add-card-label">Add First Property</div>
      <div class="add-card-hint">Paste a listing URL in the bar above</div>
    </div>`;
    return;
  }

  grid.innerHTML = ps.map(p => {
    const cf = calcCashFlow(p);
    const repTotal = calcRepairTotal(p);
    const shortAddr = p.address ? p.address.split(',').slice(0, 2).join(',') : '(No address set)';
    let cfHTML = '';
    if (p.units && p.units.length > 1) {
      const cfVal = cf.currentCF;
      const cls = cfVal > 0 ? 'cf-pos' : cfVal < -100 ? 'cf-neg' : '';
      cfHTML = `<span class="dpc-cashflow ${cls}">${cfVal > 0 ? '+' : ''}${fmt$(cfVal)}/mo</span>`;
    }
    return `<div class="dash-prop-card" onclick="clickPropCard('${p.id}')">
      <div class="dpc-status">
        ${statusBadgeHTML(p.status)}
        <span style="font-size:0.8rem;color:var(--text-muted)">${fmtDate(p.createdAt)}</span>
      </div>
      <div class="dpc-address">${shortAddr}</div>
      <div class="dpc-price">${p.price ? fmt$(p.price) : '—'}</div>
      <div class="dpc-chips">
        ${p.propertyType ? `<span class="dpc-chip">${p.propertyType}</span>` : ''}
        ${p.beds ? `<span class="dpc-chip">${p.beds} bd / ${p.baths} ba</span>` : ''}
        ${p.sqft ? `<span class="dpc-chip">${Number(p.sqft).toLocaleString()} sqft</span>` : ''}
        ${p.yearBuilt ? `<span class="dpc-chip">Built ${p.yearBuilt}</span>` : ''}
        ${repTotal > 0 ? `<span class="dpc-chip">🔧 ${fmtK(repTotal)} repairs</span>` : ''}
      </div>
      <div class="dpc-bottom">
        <span class="dpc-stars">${stars(p.rating)}</span>
        ${cfHTML}
      </div>
    </div>`;
  }).join('');
}

// ── PROPERTY DETAIL ───────────────────────────────────────────────────────────

function renderPropertyDetail() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;

  // Header
  el('d-status-badge').className = `status-badge s-${p.status}`;
  el('d-status-badge').textContent = STATUS_LABELS[p.status];
  el('d-address').textContent = p.address || '(Address not set)';
  el('d-price').textContent   = p.price ? fmt$(p.price) : '—';
  el('d-type').textContent    = p.propertyType || '—';
  el('d-bedbath').textContent = p.beds ? `${p.beds}bd / ${p.baths}ba` : '—';
  el('d-sqft').textContent    = p.sqft ? `${Number(p.sqft).toLocaleString()} sqft` : '—';
  el('d-year').textContent    = p.yearBuilt ? `Built ${p.yearBuilt}` : '—';

  // Stars display
  renderStarsDisplay(p.rating);

  // Listing link
  const ll = el('d-listing-link');
  if (p.url) { ll.href = p.url; ll.style.display = ''; } else { ll.style.display = 'none'; }

  // Status select
  el('d-status-select').value = p.status;

  // Render active tab
  renderActiveTab();
}

function renderStarsDisplay(rating) {
  el('d-stars-display').querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', Number(s.dataset.v) <= rating);
  });
}

function renderActiveTab() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  switch (state.activeTab) {
    case 'overview':    renderOverview(p); break;
    case 'financials':  renderFinancials(p); break;
    case 'repairs':     renderRepairs(p); break;
    case 'location':    renderLocation(p); break;
    case 'rentability': renderRentability(p); break;
    case 'notes':       renderNotes(p); break;
  }
}

// ── OVERVIEW TAB — Instant Analysis Report ────────────────────────────────────

function renderOverview(p) {
  const cf   = calcCashFlow(p);
  const exp  = cf.exp;
  const rep  = calcRepairTotal(p);
  const eff  = (p.price || 0) + rep;
  const ppsf = p.sqft && p.price ? Math.round(p.price / p.sqft) : null;
  const hasMissingData = !p.price || !p.address;

  // Color helpers
  const cfColor  = (n) => n >  100 ? '#2d7a4f' : n > -200 ? '#c9862c' : '#c94c4c';
  const cfBg     = (n) => n >  100 ? '#e8f5ee' : n > -200 ? '#fdf3e5' : '#fdf0f0';
  const cfSign   = (n) => n >= 0 ? '+' : '';
  const repColor = rep > 20000 ? '#c94c4c' : rep > 8000 ? '#c9862c' : '#2d7a4f';

  // ── Inline Quick-Fill (shown whenever address OR price is missing) ──────────
  const allUnitsRent = (p.units || []).slice(1).reduce((s, u) => s + (Number(u.rent) || 0), 0);
  const missingBanner = hasMissingData ? `
    <div class="quick-fill-panel">
      <div class="qf-header">
        <span class="qf-icon">🏡</span>
        <div>
          <div class="qf-title">Enter Property Details</div>
          <div class="qf-sub">Fill in what you know — the analysis updates instantly.</div>
        </div>
      </div>
      <div class="qf-grid">
        <div class="fg qf-full"><label>Address</label>
          <input type="text" id="qf-address" value="${p.address || ''}" placeholder="123 Oak St, Waukesha, WI 53188" />
        </div>
        <div class="fg"><label>Asking Price</label>
          <div class="inp-pre"><span>$</span><input type="number" id="qf-price" value="${p.price || ''}" placeholder="350000" /></div>
        </div>
        <div class="fg"><label>Property Type</label>
          <select id="qf-type">
            <option value="duplex"   ${p.propertyType==='duplex'   ?'selected':''}>Duplex (2 units)</option>
            <option value="triplex"  ${p.propertyType==='triplex'  ?'selected':''}>Triplex (3 units)</option>
            <option value="fourplex" ${p.propertyType==='fourplex' ?'selected':''}>Fourplex (4 units)</option>
            <option value="single"   ${p.propertyType==='single'   ?'selected':''}>Single Family</option>
          </select>
        </div>
        <div class="fg"><label>Beds</label>
          <input type="number" id="qf-beds" value="${p.beds || ''}" placeholder="4" />
        </div>
        <div class="fg"><label>Baths</label>
          <input type="number" id="qf-baths" value="${p.baths || ''}" placeholder="2" step="0.5" />
        </div>
        <div class="fg"><label>Sq Ft</label>
          <input type="number" id="qf-sqft" value="${p.sqft || ''}" placeholder="2400" />
        </div>
        <div class="fg"><label>Year Built</label>
          <input type="number" id="qf-year" value="${p.yearBuilt || ''}" placeholder="1985" />
        </div>
        <div class="fg"><label>Annual Taxes</label>
          <div class="inp-pre"><span>$</span><input type="number" id="qf-tax" value="${p.taxAnnual || ''}" placeholder="4500" /></div>
        </div>
        <div class="fg"><label>Est. Monthly Rent (Unit 2)</label>
          <div class="inp-pre"><span>$</span><input type="number" id="qf-rent" value="${allUnitsRent || ''}" placeholder="1400" /></div>
        </div>
        <div class="fg"><label>School District</label>
          <input type="text" id="qf-school" value="${p.schoolDistrict || ''}" placeholder="e.g. Waukesha School District" />
        </div>
      </div>
      <button class="btn-gold btn-full" onclick="saveQuickFill()">→ Run Full Analysis</button>
    </div>` : '';

  // ── FINANCIAL ASSUMPTIONS BAR — always visible, always editable ──────────
  const assumptionsBar = `
    <div class="assumptions-bar">
      <span class="assum-label">📐 Assumptions</span>
      <div class="assum-field">
        <label>Down Payment</label>
        <div class="assum-inp-wrap">
          <input type="number" id="assum-down" value="${p.downPct || 5}" min="0" max="100" step="1" oninput="liveRecalc()" />
          <span>%</span>
        </div>
      </div>
      <div class="assum-field">
        <label>Rate</label>
        <div class="assum-inp-wrap">
          <input type="number" id="assum-rate" value="${p.rate || 7}" step="0.125" oninput="liveRecalc()" />
          <span>%</span>
        </div>
      </div>
      <div class="assum-field">
        <label>Rent / Unit 2</label>
        <div class="assum-inp-wrap">
          <span>$</span>
          <input type="number" id="assum-rent" value="${allUnitsRent || ''}" placeholder="1400" oninput="liveRecalc()" />
        </div>
      </div>
      <div class="assum-field">
        <label>Annual Tax</label>
        <div class="assum-inp-wrap">
          <span>$</span>
          <input type="number" id="assum-tax" value="${p.taxAnnual || ''}" placeholder="4500" oninput="liveRecalc()" />
        </div>
      </div>
      <button class="assum-save-btn" onclick="saveAssumptions()">Save ✓</button>
    </div>`;

  // ── QUICK STATS BAND ───────────────────────────────────────────────────────
  const statsBand = `
    <div class="qs-band">
      <div class="qs-box" style="background:var(--navy)">
        <div class="qs-label" style="color:rgba(255,255,255,0.55)">Monthly Cost</div>
        <div class="qs-num" style="color:#fff">${p.price ? fmt$(exp.total) : '—'}</div>
        <div class="qs-sub" style="color:rgba(255,255,255,0.45)">PITI + maintenance</div>
      </div>
      <div class="qs-box" style="background:${cfBg(cf.currentCF)}">
        <div class="qs-label">Cash Flow (living in)</div>
        <div class="qs-num" style="color:${cfColor(cf.currentCF)}">${p.price ? cfSign(cf.currentCF)+fmt$(cf.currentCF)+'/mo' : '—'}</div>
        <div class="qs-sub">${cf.grossRent > 0 ? `Rental covers ${fmt$(cf.grossRent)}/mo` : 'Add rental income estimate'}</div>
      </div>
      <div class="qs-box" style="background:${cfBg(cf.fullCF)}">
        <div class="qs-label">Full Investment CF</div>
        <div class="qs-num" style="color:${cfColor(cf.fullCF)}">${p.price ? cfSign(cf.fullCF)+fmt$(cf.fullCF)+'/mo' : '—'}</div>
        <div class="qs-sub">When both units rented</div>
      </div>
      <div class="qs-box" style="background:${rep > 15000 ? '#fdf0f0' : rep > 5000 ? '#fdf3e5' : '#f7f5f2'}">
        <div class="qs-label">Repairs Estimate</div>
        <div class="qs-num" style="color:${repColor}">${rep > 0 ? fmtK(rep) : 'Not set'}</div>
        <div class="qs-sub">Effective price: ${fmt$(eff)}</div>
      </div>
    </div>`;

  // ── FINANCIAL BREAKDOWN + DISTANCES ──────────────────────────────────────
  const loanAmt = (p.price || 0) * (1 - (p.downPct || 20) / 100);

  const breakdownRows = [
    { label: 'Mortgage (P&I)',          amt: exp.mortgage,  note: `${p.downPct||20}% down · ${p.rate||7}% · ${p.term||30}yr` },
    { label: 'Property Taxes',          amt: exp.taxes,     note: p.taxAnnual ? fmt$(p.taxAnnual)+'/yr' : 'Not set' },
    { label: 'Insurance',               amt: exp.insurance, note: p.insAnnual ? fmt$(p.insAnnual)+'/yr' : 'Est. needed' },
    { label: 'HOA',                     amt: exp.hoa,       note: '', hide: !exp.hoa },
    { label: 'Maintenance Reserve',     amt: exp.maint,     note: `${p.maintPct||1}% of value/yr` },
  ].filter(r => !r.hide);

  const breakdown = `
    <div class="ov-section-card">
      <div class="ov-section-title">💳 Monthly Breakdown</div>
      <div class="ov-breakdown">
        ${breakdownRows.map(r => `
          <div class="ovbr-row">
            <span class="ovbr-label">${r.label}</span>
            <div class="ovbr-right">
              ${r.note ? `<span class="ovbr-note">${r.note}</span>` : ''}
              <span class="ovbr-amt">${r.amt > 0 ? fmt$(r.amt) : '—'}</span>
            </div>
          </div>`).join('')}
        <div class="ovbr-row ovbr-total">
          <span>TOTAL / month</span>
          <span>${p.price ? fmt$(exp.total) : '—'}</span>
        </div>
        <div class="ovbr-row" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border)">
          <span class="ovbr-label">Loan amount</span>
          <span class="ovbr-amt">${fmt$(loanAmt)}</span>
        </div>
        <div class="ovbr-row">
          <span class="ovbr-label">Down payment</span>
          <span class="ovbr-amt">${fmt$(cf.downAmt)} <span style="color:var(--text-muted)">(${p.downPct||20}%)</span></span>
        </div>
        ${p.price && ppsf ? `<div class="ovbr-row"><span class="ovbr-label">Price per sqft</span><span class="ovbr-amt">$${ppsf}/sf</span></div>` : ''}
        ${p.taxAnnual && p.price ? `<div class="ovbr-row"><span class="ovbr-label">Tax rate est.</span><span class="ovbr-amt">${((p.taxAnnual/p.price)*100).toFixed(2)}%</span></div>` : ''}
      </div>
    </div>`;

  const distancesHTML = `
    <div class="ov-section-card">
      <div class="ov-section-title">📍 Drive Times</div>
      ${KEY_LOCATIONS.map(loc => `
        <div class="ovdist-row">
          <span class="ovdist-icon">${loc.icon}</span>
          <div class="ovdist-info">
            <div class="ovdist-name">${loc.name}</div>
            <div class="ovdist-addr">${loc.addr}</div>
          </div>
          ${p.address
            ? `<a class="ovdist-link" href="${mapUrl(p.address, loc.addr)}" target="_blank" rel="noopener">Get Directions ↗</a>`
            : `<span class="ovdist-na">Add address</span>`}
        </div>`).join('')}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
        <div class="ovbr-row">
          <span class="ovbr-label">🎓 School District</span>
          <span class="ovbr-amt">${p.schoolDistrict || '<span style="color:var(--text-light)">Not set</span>'}</span>
        </div>
        <div class="ovbr-row">
          <span class="ovbr-label">🏙️ Year Built</span>
          <span class="ovbr-amt">${p.yearBuilt || '—'}</span>
        </div>
        <div class="ovbr-row">
          <span class="ovbr-label">📐 Lot Size</span>
          <span class="ovbr-amt">${p.lot || '—'}</span>
        </div>
        <div class="ovbr-row">
          <span class="ovbr-label">📅 Days on Market</span>
          <span class="ovbr-amt">${p.dom || '—'}</span>
        </div>
      </div>
    </div>`;

  // ── RENTAL ANALYSIS BAND ──────────────────────────────────────────────────
  const breakEven = exp.total / Math.max((p.units||[]).length - 1, 1);
  const rentalBand = `
    <div class="ov-section-card ov-rental-band">
      <div class="ov-section-title">🏘️ Rentability Analysis</div>
      <div class="ov-rent-grid">
        <div class="ovrent-box">
          <div class="ovrent-label">📍 Living in Unit 1</div>
          <div class="ovrent-cf" style="color:${cfColor(cf.currentCF)}">${p.price ? cfSign(cf.currentCF)+fmt$(cf.currentCF)+'/mo' : '—'}</div>
          <div class="ovrent-detail">Income: ${fmt$(cf.netRent)}/mo · Cost: ${fmt$(exp.total)}/mo</div>
          <div class="ovrent-detail">Out of pocket: ${fmt$(Math.max(0, exp.total - cf.netRent))}/mo</div>
        </div>
        <div class="ovrent-box">
          <div class="ovrent-label">🚀 Full Investment (both rented)</div>
          <div class="ovrent-cf" style="color:${cfColor(cf.fullCF)}">${p.price ? cfSign(cf.fullCF)+fmt$(cf.fullCF)+'/mo' : '—'}</div>
          <div class="ovrent-detail">Income: ${fmt$(cf.allNetRent)}/mo · Annual: ${fmt$(cf.fullCF*12)}/yr</div>
          <div class="ovrent-detail">Cash-on-Cash: ${cf.cocFull ? cf.cocFull.toFixed(1)+'%' : '—'}</div>
        </div>
        <div class="ovrent-box">
          <div class="ovrent-label">⚖️ Break-Even Rent Needed</div>
          <div class="ovrent-cf" style="color:var(--navy)">${p.price ? fmt$(breakEven)+'/unit' : '—'}</div>
          <div class="ovrent-detail">To fully cover all monthly expenses</div>
          <div class="ovrent-detail">Vacancy: ${p.vacancyPct||5}% assumed</div>
        </div>
        <div class="ovrent-box">
          <div class="ovrent-label">📊 Cash-on-Cash Return</div>
          <div class="ovrent-cf" style="color:${cf.coc > 5 ? '#2d7a4f' : cf.coc > 0 ? '#c9862c' : '#c94c4c'}">${cf.coc ? cf.coc.toFixed(1)+'%' : '—'}</div>
          <div class="ovrent-detail">Total invested: ${fmt$(cf.totalIn)}</div>
          <div class="ovrent-detail">(down + closing + repairs)</div>
        </div>
      </div>
    </div>`;

  // ── QUICK RESEARCH LINKS ──────────────────────────────────────────────────
  const links = RESEARCH_LINKS(p.address || '');
  const researchRow = `
    <div class="ov-section-card">
      <div class="ov-section-title">🔍 Location Research</div>
      <div class="ov-research-chips">
        ${links.map(l => `<a class="ov-chip" href="${l.url}" target="_blank" rel="noopener">${l.icon} ${l.label} ↗</a>`).join('')}
      </div>
    </div>`;

  // ── NOTES PREVIEW ──────────────────────────────────────────────────────────
  const notesPreview = (p.notes || p.pros || p.cons) ? `
    <div class="ov-section-card">
      <div class="ov-section-title">📝 Notes</div>
      ${p.pros ? `<div style="margin-bottom:6px"><span style="color:var(--green);font-weight:700">✅ Pros: </span><span style="font-size:0.85rem;color:var(--text-muted)">${p.pros}</span></div>` : ''}
      ${p.cons ? `<div style="margin-bottom:6px"><span style="color:var(--red);font-weight:700">⚠️ Cons: </span><span style="font-size:0.85rem;color:var(--text-muted)">${p.cons}</span></div>` : ''}
      ${p.notes ? `<div style="font-size:0.83rem;color:var(--text-muted);white-space:pre-wrap">${p.notes.slice(0,300)}${p.notes.length>300?'…':''}</div>` : ''}
    </div>` : '';

  el('tab-overview').innerHTML = missingBanner + assumptionsBar + statsBand +
    `<div class="ov-two-col">${breakdown}${distancesHTML}</div>` +
    rentalBand + researchRow + notesPreview;
}

// ── QUICK FILL & LIVE ASSUMPTION SAVE ────────────────────────────────────────

window.saveQuickFill = function() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  const v = (id) => el(id)?.value?.trim();
  const n = (id) => Number(el(id)?.value) || 0;

  if (v('qf-address')) p.address      = v('qf-address');
  if (n('qf-price'))   p.price        = n('qf-price');
  const type = v('qf-type');
  if (type) {
    p.propertyType = type;
    const numU = numUnitsForType(type);
    while (p.units.length < numU)
      p.units.push({ label: `Unit ${p.units.length+1} (Rental)`, beds:'', baths:'', sqft:'', rent: 0 });
    p.units = p.units.slice(0, numU);
  }
  if (v('qf-beds'))    p.beds         = v('qf-beds');
  if (v('qf-baths'))   p.baths        = v('qf-baths');
  if (v('qf-sqft'))    p.sqft         = v('qf-sqft');
  if (v('qf-year'))    p.yearBuilt    = v('qf-year');
  if (n('qf-tax'))     p.taxAnnual    = n('qf-tax');
  if (v('qf-school'))  p.schoolDistrict = v('qf-school');
  const rent = n('qf-rent');
  if (rent && p.units.length > 1) p.units[1].rent = rent;

  p.updatedAt = new Date().toISOString();
  save();
  renderPropertyDetail();
  renderSidebar();
  showToast('Analysis updated! 🎉');
};

window.saveAssumptions = function() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  const down = Number(el('assum-down')?.value);
  const rate = Number(el('assum-rate')?.value);
  const rent = Number(el('assum-rent')?.value);
  const tax  = Number(el('assum-tax')?.value);
  if (!isNaN(down)) p.downPct   = down;
  if (!isNaN(rate)) p.rate      = rate;
  if (!isNaN(tax) && tax)  p.taxAnnual = tax;
  if (!isNaN(rent) && rent && p.units.length > 1) p.units[1].rent = rent;
  p.updatedAt = new Date().toISOString();
  save();
  renderPropertyDetail();
  renderSidebar();
  showToast('Assumptions saved.');
};

// Live recalc — updates numbers while typing without saving
window.liveRecalc = function() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  const draft = { ...p };
  const down = Number(el('assum-down')?.value);
  const rate = Number(el('assum-rate')?.value);
  const rent = Number(el('assum-rent')?.value);
  const tax  = Number(el('assum-tax')?.value);
  if (!isNaN(down)) draft.downPct = down;
  if (!isNaN(rate)) draft.rate    = rate;
  if (!isNaN(tax) && tax) draft.taxAnnual = tax;
  if (!isNaN(rent) && rent && draft.units?.length > 1) {
    draft.units = draft.units.map((u, i) => i === 1 ? { ...u, rent } : u);
  }
  // Just re-render the stats band and rental section inline
  const cf  = calcCashFlow(draft);
  const rep = calcRepairTotal(draft);
  const cfColor = (n) => n > 100 ? '#2d7a4f' : n > -200 ? '#c9862c' : '#c94c4c';
  const cfSign  = (n) => n >= 0 ? '+' : '';
  const band = document.querySelector('.qs-band');
  if (!band) return;
  const boxes = band.querySelectorAll('.qs-box');
  if (boxes[0]) boxes[0].querySelector('.qs-num').textContent = draft.price ? fmt$(cf.exp.total) : '—';
  if (boxes[1]) {
    boxes[1].querySelector('.qs-num').style.color = cfColor(cf.currentCF);
    boxes[1].querySelector('.qs-num').textContent = draft.price ? cfSign(cf.currentCF)+fmt$(cf.currentCF)+'/mo' : '—';
    boxes[1].querySelector('.qs-sub').textContent = cf.grossRent > 0 ? `Rental covers ${fmt$(cf.grossRent)}/mo` : 'Add rental income estimate';
  }
  if (boxes[2]) {
    boxes[2].querySelector('.qs-num').style.color = cfColor(cf.fullCF);
    boxes[2].querySelector('.qs-num').textContent = draft.price ? cfSign(cf.fullCF)+fmt$(cf.fullCF)+'/mo' : '—';
  }
};

// ── FINANCIALS TAB ────────────────────────────────────────────────────────────

function renderFinancials(p) {
  el('fi-price').value    = p.price || '';
  el('fi-down').value     = p.downPct || 20;
  el('fi-rate').value     = p.rate || 7;
  el('fi-term').value     = p.term || 30;
  el('fi-tax').value      = p.taxAnnual || '';
  el('fi-insurance').value= p.insAnnual || '';
  el('fi-hoa').value      = p.hoaMonthly || 0;
  const allUnitsRent = (p.units || []).slice(1).reduce((s, u) => s + (Number(u.rent) || 0), 0);
  el('fi-rent').value     = allUnitsRent || '';
  renderFinCalc(p);
}

function renderFinCalc(p) {
  const cf   = calcCashFlow(p);
  const exp  = cf.exp;
  const rep  = calcRepairTotal(p);
  const proj = calcProjection(p, 5);

  // Breakdown
  el('fi-breakdown').innerHTML = [
    { label: 'Mortgage (P&I)',       amount: exp.mortgage },
    { label: 'Property Taxes / mo',  amount: exp.taxes },
    { label: 'Insurance / mo',       amount: exp.insurance },
    { label: 'HOA / mo',             amount: exp.hoa },
    { label: `Maint. Reserve (${p.maintPct || 1}%)`, amount: exp.maint },
    { label: 'TOTAL MONTHLY COST',   amount: exp.total, bold: true },
  ].map(r => `<div class="breakdown-row ${r.bold ? 'total-row' : ''}">
    <span class="label">${r.label}</span>
    <span class="amount">${fmt$(r.amount)}</span>
  </div>`).join('');

  // Scenarios
  const scenarios = [
    {
      title: '📍 Living in Unit 1',
      sub: 'You live in Unit 1, rent other unit(s)',
      cf: cf.currentCF,
      detail: `Rental income: ${fmt$(cf.netRent)}/mo`,
    },
    {
      title: '🚀 Full Investment',
      sub: 'All units rented (future exit)',
      cf: cf.fullCF,
      detail: `All rent: ${fmt$(cf.allNetRent)}/mo`,
    },
    {
      title: '💼 Cash-on-Cash (Current)',
      sub: 'Annual return on cash invested',
      cf: cf.coc,
      detail: `Total invested: ${fmt$(cf.totalIn)}`,
      isPct: true,
    },
    {
      title: '📈 Cash-on-Cash (Full Invest)',
      sub: 'When all units are rented',
      cf: cf.cocFull,
      detail: `Break-even at ${fmt$(cf.exp.total)}/mo`,
      isPct: true,
    },
  ];

  el('fi-scenarios').innerHTML = `<div class="scenario-grid">${scenarios.map(s => {
    const cls = s.isPct ? (s.cf > 5 ? 'positive' : s.cf > 0 ? 'neutral' : 'negative')
                        : (s.cf > 0 ? 'positive' : s.cf > -200 ? 'neutral' : 'negative');
    const sign = s.isPct ? '' : (s.cf > 0 ? '+' : '');
    const valStr = s.isPct ? `${s.cf.toFixed(1)}%` : `${sign}${fmt$(s.cf)}/mo`;
    return `<div class="scenario-box ${cls}">
      <div class="sb-label">${s.title}</div>
      <div class="sb-amount">${valStr}</div>
      <div class="sb-sub">${s.sub}</div>
      <div class="sb-sub" style="margin-top:4px;font-size:0.7rem">${s.detail}</div>
    </div>`;
  }).join('')}</div>`;

  // Projection
  if (proj.length) {
    el('fi-projection').innerHTML = `<table class="projection-table">
      <thead><tr><th>Year</th><th>Home Value</th><th>Loan Balance</th><th>Equity</th><th>Annual Cash Flow</th></tr></thead>
      <tbody>${proj.map(r => `<tr>
        <td>Year ${r.yr}</td>
        <td>${fmt$(r.price)}</td>
        <td>${fmt$(r.loanBal)}</td>
        <td style="font-weight:700;color:var(--green)">${fmt$(r.equity)}</td>
        <td class="${r.annualCF >= 0 ? 'cf-pos' : 'cf-neg'}">${r.annualCF >= 0 ? '+' : ''}${fmt$(r.annualCF)}</td>
      </tr>`).join('')}</tbody>
    </table><p style="font-size:0.72rem;color:var(--text-light);margin-top:8px">Assumes 4% annual appreciation, 3% rent growth.</p>`;
  }
}

// ── REPAIRS TAB ───────────────────────────────────────────────────────────────

function renderRepairs(p) {
  const repairs = p.repairs || {};

  el('repairs-tbody').innerHTML = REPAIR_ITEMS.map(item => {
    const r = repairs[item.key] || { condition: 'good', age: '', cost: 0, notes: '' };
    return `<tr>
      <td><span style="margin-right:6px">${item.icon}</span>${item.label}</td>
      <td><input type="text" class="ri-age" data-key="${item.key}" value="${r.age || ''}" placeholder="e.g., 5 yrs" style="width:100%;border:1px solid var(--border);padding:4px 7px;border-radius:5px;font-size:0.8rem;background:var(--cream);outline:none" /></td>
      <td>
        <select class="cond-select ri-cond ${r.condition || 'good'}" data-key="${item.key}" onchange="this.className='cond-select ri-cond '+this.value; updateRepairTotal()">
          <option value="good"    ${r.condition==='good'    ? 'selected':''}>Good</option>
          <option value="fair"    ${r.condition==='fair'    ? 'selected':''}>Fair</option>
          <option value="poor"    ${r.condition==='poor'    ? 'selected':''}>Poor</option>
          <option value="unknown" ${r.condition==='unknown' ? 'selected':''}>Unknown</option>
        </select>
      </td>
      <td>
        <div class="inp-pre" style="width:130px">
          <span>$</span>
          <input type="number" class="ri-cost" data-key="${item.key}" value="${r.cost || 0}" oninput="updateRepairTotal()" style="border:none;padding:5px 8px;background:transparent;outline:none;width:80px" />
        </div>
      </td>
    </tr>`;
  }).join('');

  renderOtherItems(repairs.other || []);
  updateRepairTotal();
  renderRepairsSidebar(p);
}

function renderOtherItems(items) {
  el('other-items').innerHTML = items.map((oi, i) => `
    <div class="other-item-row">
      <input type="text" class="oi-desc" data-i="${i}" value="${oi.description || ''}" placeholder="Description" />
      <div class="inp-pre other-item-cost"><span>$</span><input type="number" class="oi-cost" data-i="${i}" value="${oi.cost || 0}" oninput="updateRepairTotal()" style="border:none;padding:5px 8px;background:transparent;outline:none;width:70px" /></div>
      <button class="remove-btn" onclick="removeOtherItem(${i})">✕</button>
    </div>`).join('');
}

function removeOtherItem(i) {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  p.repairs.other.splice(i, 1);
  save();
  renderOtherItems(p.repairs.other);
  updateRepairTotal();
  renderRepairsSidebar(p);
}

function updateRepairTotal() {
  let total = 0;
  document.querySelectorAll('.ri-cost').forEach(inp => { total += Number(inp.value) || 0; });
  document.querySelectorAll('.oi-cost').forEach(inp => { total += Number(inp.value) || 0; });
  el('repairs-total').textContent = fmt$(total);

  const p = state.properties.find(x => x.id === state.activeId);
  if (p) renderRepairsSidebar(p, total);
}

function renderRepairsSidebar(p, liveTotal) {
  const repairs = p.repairs || {};
  const repTotal = liveTotal !== undefined ? liveTotal : calcRepairTotal(p);

  el('repairs-breakdown').innerHTML = REPAIR_ITEMS.map(item => {
    const cost = Number(document.querySelector(`.ri-cost[data-key="${item.key}"]`)?.value || repairs[item.key]?.cost || 0);
    if (!cost) return '';
    return `<div class="rb-row"><span class="rb-name">${item.icon} ${item.label}</span><span class="rb-cost has-cost">${fmt$(cost)}</span></div>`;
  }).filter(Boolean).join('') || '<p style="font-size:0.82rem;color:var(--text-muted)">No repair costs entered yet.</p>';

  el('effective-price-box').innerHTML = `
    <div class="ep-row"><span class="ep-label">Asking Price</span><span>${fmt$(p.price)}</span></div>
    <div class="ep-row"><span class="ep-label">Est. Repairs</span><span style="color:var(--red)">${fmt$(repTotal)}</span></div>
    <div class="ep-row"><span class="ep-label">Effective Price</span><span>${fmt$((p.price || 0) + repTotal)}</span></div>
    <div class="ep-row" style="margin-top:8px;padding-top:8px;border-top:2px solid var(--border)"><span class="ep-label">$/SqFt (effective)</span><span>${p.sqft ? '$' + (((p.price || 0) + repTotal) / p.sqft).toFixed(0) : '—'}</span></div>`;
}

// ── LOCATION TAB ─────────────────────────────────────────────────────────────

function renderLocation(p) {
  el('loc-school').value = p.schoolDistrict || '';
  el('loc-notes').value  = p.locationNotes  || '';

  // Research links
  const links = RESEARCH_LINKS(p.address || '');
  el('research-links').innerHTML = `<div class="resource-links">${links.map(l =>
    `<a class="res-link" href="${l.url}" target="_blank" rel="noopener">
      <span class="res-icon">${l.icon}</span>
      <span class="res-label">${l.label}</span>
      <span class="res-link-external">↗</span>
    </a>`).join('')}</div>`;

  // Distances
  el('loc-distances').innerHTML = KEY_LOCATIONS.map(loc => `
    <div class="distance-item">
      <div class="dist-icon">${loc.icon}</div>
      <div class="dist-info">
        <div class="dist-name">${loc.name}</div>
        <div class="dist-addr">${loc.addr}</div>
      </div>
      ${p.address
        ? `<a class="dist-link" href="${mapUrl(p.address, loc.addr)}" target="_blank" rel="noopener">Directions ↗</a>`
        : '<span style="font-size:0.75rem;color:var(--text-light)">Add address first</span>'}
    </div>`).join('');
}

// ── RENTABILITY TAB ───────────────────────────────────────────────────────────

function renderRentability(p) {
  const units = p.units || [];

  // Units display
  el('rent-units').innerHTML = `<div class="units-display">${units.map((u, i) => `
    <div class="unit-box ${i === 0 ? 'owner-unit' : 'rental-unit'}">
      <div class="unit-label">${i === 0 ? '🏠 Your Unit' : '💰 Rental Unit'}</div>
      <div class="unit-name">${u.label}</div>
      <div class="unit-meta">${[u.beds ? `${u.beds} bd` : '', u.baths ? `${u.baths} ba` : '', u.sqft ? `${Number(u.sqft).toLocaleString()} sf` : ''].filter(Boolean).join(' · ') || '(Details not set)'}</div>
      ${i > 0 ? `<div class="unit-rent">${u.rent ? fmt$(u.rent) + '/mo' : 'Rent: TBD'}</div>` : `<div class="unit-rent" style="opacity:0.6">Owner Occupied</div>`}
    </div>`).join('')}</div>`;

  // Cash flow
  const cf  = calcCashFlow(p);
  const exp = cf.exp;

  el('rent-cashflow').innerHTML = `
    <div class="rs-box" style="background:var(--cream)">
      <div class="rs-title">📋 Monthly Expenses</div>
      ${[
        ['Mortgage (P&I)', exp.mortgage],
        ['Property Taxes', exp.taxes],
        ['Insurance', exp.insurance],
        ['HOA', exp.hoa],
        ['Maintenance Reserve', exp.maint],
      ].map(([l, v]) => v > 0 ? `<div class="rs-row"><span style="color:var(--text-muted)">${l}</span><span style="font-weight:600">${fmt$(v)}</span></div>` : '').join('')}
      <div class="rs-row" style="margin-top:6px;padding-top:6px;border-top:2px solid var(--border);font-weight:800">
        <span>Total / mo</span><span>${fmt$(exp.total)}</span>
      </div>
    </div>
    <div class="rs-box ${cf.currentCF >= 0 ? 'positive' : cf.currentCF > -300 ? 'neutral' : 'negative'}">
      <div class="rs-title">📍 Living in Unit 1</div>
      <div class="rs-cf ${cf.currentCF > 0 ? 'pos' : cf.currentCF < -100 ? 'neg' : 'even'}">${cf.currentCF >= 0 ? '+' : ''}${fmt$(cf.currentCF)}/mo</div>
      <div class="rs-detail">Rental income: ${fmt$(cf.grossRent)}/mo (after ${p.vacancyPct}% vacancy)</div>
      <div class="rs-detail">You cover: ${fmt$(exp.total - cf.netRent)}/mo out of pocket</div>
    </div>
    <div class="rs-box ${cf.fullCF >= 0 ? 'positive' : 'negative'}">
      <div class="rs-title">🚀 Full Investment (Both Rented)</div>
      <div class="rs-cf ${cf.fullCF > 0 ? 'pos' : 'neg'}">${cf.fullCF >= 0 ? '+' : ''}${fmt$(cf.fullCF)}/mo</div>
      <div class="rs-detail">All units rent: ${fmt$(cf.allNetRent)}/mo</div>
      <div class="rs-detail">Annual income: ${fmt$(cf.fullCF * 12)}/yr</div>
    </div>
    <div class="rs-box neutral">
      <div class="rs-title">💼 Break-Even Rent Needed</div>
      <div class="rs-cf even" style="font-size:1.1rem">${fmt$(exp.total / Math.max(units.length - 1, 1))}/unit</div>
      <div class="rs-detail">To cover all expenses while you live there</div>
      <div class="rs-detail">Cash-on-Cash: ${cf.coc.toFixed(1)}% (current) / ${cf.cocFull.toFixed(1)}% (full)</div>
    </div>`;

  // Market research links
  el('rent-research-links').innerHTML = `<div class="market-links">${RENTAL_RESEARCH_LINKS(p.address || '').map(l =>
    `<a class="res-link" href="${l.url}" target="_blank" rel="noopener">
      <span class="res-icon">${l.icon}</span>
      <span class="res-label">${l.label}</span>
      <span class="res-link-external">↗</span>
    </a>`).join('')}</div>`;

  // Comps
  renderComps(p);
}

function renderComps(p) {
  const comps = p.comps || [];
  const ppsf  = p.sqft && p.price ? (p.price / p.sqft).toFixed(0) : null;

  el('comps-tbody').innerHTML =
    // Subject property row
    `<tr style="background:var(--amber-bg);font-weight:700">
      <td>📍 <b>${p.address ? p.address.split(',')[0] : 'This Property'}</b></td>
      <td>${fmt$(p.price)}</td>
      <td>${p.sqft ? Number(p.sqft).toLocaleString() : '—'}</td>
      <td>${ppsf ? '$' + ppsf : '—'}</td>
      <td>${p.taxAnnual ? fmt$(p.taxAnnual) : '—'}</td>
      <td>Subject</td>
      <td></td>
    </tr>` +
    comps.map((c, i) => {
      const cppsf = c.sqft && c.price ? (c.price / c.sqft).toFixed(0) : null;
      return `<tr>
        <td><input type="text"  class="c-addr" data-i="${i}" value="${c.address || ''}" placeholder="123 Oak St, City, WI" /></td>
        <td><div class="inp-pre" style="width:110px"><span>$</span><input type="number" class="c-price" data-i="${i}" value="${c.price || ''}" /></div></td>
        <td><input type="number" class="c-sqft"  data-i="${i}" value="${c.sqft  || ''}" style="width:70px;border:1px solid var(--border);padding:4px 6px;border-radius:4px" /></td>
        <td>${cppsf ? '$' + cppsf : '—'}</td>
        <td><div class="inp-pre" style="width:100px"><span>$</span><input type="number" class="c-tax" data-i="${i}" value="${c.taxAnnual || ''}" /></div></td>
        <td><input type="text"  class="c-notes" data-i="${i}" value="${c.notes || ''}" placeholder="Notes" /></td>
        <td><button class="remove-btn" onclick="removeComp(${i})">✕</button></td>
      </tr>`;
    }).join('');
}

function removeComp(i) {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  p.comps.splice(i, 1);
  save();
  renderComps(p);
}

function saveComps() {
  const p = state.properties.find(x => x.id === state.activeId);
  if (!p) return;
  const comps = [];
  document.querySelectorAll('.c-addr').forEach((el, i) => {
    comps.push({
      address:   el.value,
      price:     Number(document.querySelector(`.c-price[data-i="${i}"]`)?.value || 0),
      sqft:      Number(document.querySelector(`.c-sqft[data-i="${i}"]`)?.value  || 0),
      taxAnnual: Number(document.querySelector(`.c-tax[data-i="${i}"]`)?.value   || 0),
      notes:     document.querySelector(`.c-notes[data-i="${i}"]`)?.value || '',
    });
  });
  p.comps = comps;
  save();
  showToast('Comparables saved.');
}

// ── NOTES TAB ─────────────────────────────────────────────────────────────────

function renderNotes(p) {
  el('n-pros').value  = p.pros  || '';
  el('n-cons').value  = p.cons  || '';
  el('n-notes').value = p.notes || '';
  renderStarInput(p.rating);
}

function renderStarInput(rating) {
  document.querySelectorAll('#star-input .si').forEach(s => {
    s.classList.toggle('active', Number(s.dataset.v) <= rating);
  });
}

// ── COMPARE VIEW ──────────────────────────────────────────────────────────────

function renderCompare() {
  const ids = state.compareIds;
  if (ids.length === 0) {
    el('compare-table-wrap').innerHTML = '<p class="muted-text">Select properties in the sidebar to compare.</p>';
    return;
  }
  const props = ids.map(id => state.properties.find(p => p.id === id)).filter(Boolean);

  const rows = [
    { label: 'Address',          fn: p => p.address || '—' },
    { label: 'Asking Price',     fn: p => fmt$(p.price), compare: 'min' },
    { label: 'Price / SqFt',     fn: p => p.sqft && p.price ? '$' + (p.price/p.sqft).toFixed(0) : '—', compare: 'min' },
    { label: 'Type',             fn: p => p.propertyType || '—' },
    { label: 'Beds / Baths',     fn: p => p.beds ? `${p.beds}bd / ${p.baths}ba` : '—' },
    { label: 'Sq Ft',            fn: p => p.sqft ? Number(p.sqft).toLocaleString() : '—', compare: 'max' },
    { label: 'Year Built',       fn: p => p.yearBuilt || '—', compare: 'max' },
    { label: 'Annual Tax',       fn: p => fmt$(p.taxAnnual), compare: 'min' },
    { label: 'Repair Estimate',  fn: p => fmt$(calcRepairTotal(p)), compare: 'min', raw: p => calcRepairTotal(p) },
    { label: 'Effective Price',  fn: p => fmt$((p.price||0) + calcRepairTotal(p)), compare: 'min', raw: p => (p.price||0)+calcRepairTotal(p) },
    { label: 'Monthly Cost',     fn: p => fmt$(calcExpenses(p).total), compare: 'min', raw: p => calcExpenses(p).total },
    { label: 'Rental Income Est.',fn: p => fmt$(calcCashFlow(p).grossRent), compare: 'max', raw: p => calcCashFlow(p).grossRent },
    { label: 'Cash Flow / mo',   fn: p => fmt$(calcCashFlow(p).currentCF), compare: 'max', raw: p => calcCashFlow(p).currentCF },
    { label: 'Full Invest CF',   fn: p => fmt$(calcCashFlow(p).fullCF), compare: 'max', raw: p => calcCashFlow(p).fullCF },
    { label: 'School District',  fn: p => p.schoolDistrict || '—' },
    { label: 'Rating',           fn: p => stars(p.rating), compare: 'max', raw: p => p.rating },
    { label: 'Status',           fn: p => STATUS_LABELS[p.status] || p.status },
  ];

  el('compare-table-wrap').innerHTML = `
    <table class="compare-table">
      <thead><tr>
        <th>Metric</th>
        ${props.map(p => `<th>${p.address ? p.address.split(',')[0] : '(No address)'}<br/><span style="font-weight:400;font-size:0.75rem">${fmt$(p.price)}</span></th>`).join('')}
      </tr></thead>
      <tbody>${rows.map(row => {
        const vals = props.map(p => ({ str: row.fn(p), raw: row.raw ? row.raw(p) : null }));
        let bestIdx = -1, worstIdx = -1;
        if (row.compare && vals.every(v => v.raw !== null && !isNaN(v.raw))) {
          const raws = vals.map(v => v.raw);
          if (row.compare === 'min') { bestIdx = raws.indexOf(Math.min(...raws)); worstIdx = raws.indexOf(Math.max(...raws)); }
          else                       { bestIdx = raws.indexOf(Math.max(...raws)); worstIdx = raws.indexOf(Math.min(...raws)); }
        }
        return `<tr>
          <td style="font-weight:600;color:var(--navy)">${row.label}</td>
          ${vals.map((v, i) => `<td class="${i === bestIdx ? 'best-val' : i === worstIdx ? 'worst-val' : ''}">${v.str}${i === bestIdx ? ' ✓' : ''}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

// ── VIEW ROUTER ───────────────────────────────────────────────────────────────

function renderAll() {
  hide('view-dashboard');
  hide('view-property');
  hide('view-compare');

  renderSidebar();

  if (state.view === 'property' && state.activeId) {
    show('view-property');
    renderPropertyDetail();
  } else if (state.view === 'compare') {
    show('view-compare');
    renderCompare();
  } else {
    state.view = 'dashboard';
    show('view-dashboard');
    renderDashboard();
  }
}

// ── MODAL ─────────────────────────────────────────────────────────────────────

function openModal(url, editId) {
  state.editingId  = editId || null;
  state.modalStep  = 0;
  const p = editId
    ? JSON.parse(JSON.stringify(state.properties.find(x => x.id === editId))) // deep copy
    : defaultProperty(url || '');

  // Store draft on window for step reads
  window._modalDraft = p;

  el('modal-title').textContent = editId ? 'Edit Property' : 'Add Property';
  fillModalStep0(p);
  fillModalStep1(p);
  updateModalStepView();
  show('modal-overlay');
}

function closeModal() {
  hide('modal-overlay');
  window._modalDraft = null;
}

function fillModalStep0(p) {
  el('m-url').value     = p.url || '';
  el('m-address').value = p.address || '';
  el('m-type').value    = p.propertyType || 'duplex';
  el('m-year').value    = p.yearBuilt || '';
  el('m-beds').value    = p.beds || '';
  el('m-baths').value   = p.baths || '';
  el('m-sqft').value    = p.sqft || '';
  el('m-lot').value     = p.lot || '';
  el('m-price').value   = p.price || '';
  el('m-dom').value     = p.dom || '';
}

function fillModalStep1(p) {
  el('m-down').value    = p.downPct || 20;
  el('m-rate').value    = p.rate || 7;
  el('m-term').value    = p.term || 30;
  el('m-tax').value     = p.taxAnnual || '';
  el('m-ins').value     = p.insAnnual || '';
  el('m-hoa').value     = p.hoaMonthly || 0;
  el('m-maint').value   = p.maintPct || 1;
  el('m-closing').value = p.closingCosts || '';
  updateLiveCalc();
}

function updateLiveCalc() {
  const price = Number(el('m-price').value) || 0;
  const down  = Number(el('m-down').value)  || 20;
  const rate  = Number(el('m-rate').value)  || 7;
  const term  = Number(el('m-term').value)  || 30;
  const tax   = Number(el('m-tax').value)   || 0;
  const ins   = Number(el('m-ins').value)   || 0;
  const loan  = price * (1 - down / 100);
  const mort  = calcMortgage(price, down, rate, term);
  const piti  = mort + tax / 12 + ins / 12;
  el('lc-loan').textContent = fmt$(loan);
  el('lc-mort').textContent = fmt$(mort);
  el('lc-piti').textContent = fmt$(piti);
}

function buildUnitsForm(numUnits, existing) {
  el('m-units-form').innerHTML = Array.from({ length: numUnits }, (_, i) => {
    const u = (existing || [])[i] || { beds: '', baths: '', sqft: '', rent: 0 };
    const isOwner = i === 0;
    return `<div class="unit-form-block">
      <div class="unit-form-label ${isOwner ? 'owner' : 'rental'}">${isOwner ? '🏠 Unit 1 — YOUR UNIT (Owner Occupied)' : `💰 Unit ${i + 1} — Rental Unit`}</div>
      <div class="unit-form-grid">
        <div class="fg"><label>Beds</label><input type="number" class="u-beds" data-i="${i}" value="${u.beds || ''}" placeholder="2" /></div>
        <div class="fg"><label>Baths</label><input type="number" class="u-baths" data-i="${i}" value="${u.baths || ''}" placeholder="1" step="0.5" /></div>
        <div class="fg"><label>Sq Ft</label><input type="number" class="u-sqft" data-i="${i}" value="${u.sqft || ''}" placeholder="1000" /></div>
        ${!isOwner ? `<div class="fg"><label>Est. Monthly Rent</label><div class="inp-pre"><span>$</span><input type="number" class="u-rent" data-i="${i}" value="${u.rent || ''}" placeholder="1400" /></div></div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function buildConditionGrid(existing) {
  const repairs = existing || {};
  el('m-condition-grid').innerHTML = REPAIR_ITEMS.slice(0, 8).map(item => {
    const r = repairs[item.key] || { condition: 'good', cost: 0 };
    return `<div class="qc-item">
      <div class="qc-label">${item.icon} ${item.label}</div>
      <div class="qc-controls">
        <select class="qc-cond" data-key="${item.key}">
          <option value="good"    ${r.condition==='good'    ? 'selected':''}>Good</option>
          <option value="fair"    ${r.condition==='fair'    ? 'selected':''}>Fair</option>
          <option value="poor"    ${r.condition==='poor'    ? 'selected':''}>Poor</option>
          <option value="unknown" ${r.condition==='unknown' ? 'selected':''}>Unknown</option>
        </select>
        <div class="inp-pre" style="width:100px;flex-shrink:0">
          <span>$</span>
          <input type="number" class="qc-cost" data-key="${item.key}" value="${r.cost || 0}" style="border:none;padding:4px 6px;background:transparent;outline:none;width:60px" />
        </div>
      </div>
    </div>`;
  }).join('');
}

function readModalStep(step) {
  const d = window._modalDraft;
  if (!d) return;
  if (step === 0) {
    d.url          = el('m-url').value.trim();
    d.address      = el('m-address').value.trim();
    d.propertyType = el('m-type').value;
    d.yearBuilt    = el('m-year').value;
    d.beds         = el('m-beds').value;
    d.baths        = el('m-baths').value;
    d.sqft         = el('m-sqft').value;
    d.lot          = el('m-lot').value;
    d.price        = Number(el('m-price').value) || 0;
    d.dom          = el('m-dom').value;
  }
  if (step === 1) {
    d.downPct      = Number(el('m-down').value)    || 20;
    d.rate         = Number(el('m-rate').value)    || 7;
    d.term         = Number(el('m-term').value)    || 30;
    d.taxAnnual    = Number(el('m-tax').value)     || 0;
    d.insAnnual    = Number(el('m-ins').value)     || 0;
    d.hoaMonthly   = Number(el('m-hoa').value)     || 0;
    d.maintPct     = Number(el('m-maint').value)   || 1;
    d.closingCosts = Number(el('m-closing').value) || 0;
  }
  if (step === 2) {
    const numUnits = numUnitsForType(d.propertyType);
    d.units = Array.from({ length: numUnits }, (_, i) => ({
      label: i === 0 ? 'Unit 1 (Owner)' : `Unit ${i + 1} (Rental)`,
      beds:  document.querySelector(`.u-beds[data-i="${i}"]`)?.value  || '',
      baths: document.querySelector(`.u-baths[data-i="${i}"]`)?.value || '',
      sqft:  document.querySelector(`.u-sqft[data-i="${i}"]`)?.value  || '',
      rent:  Number(document.querySelector(`.u-rent[data-i="${i}"]`)?.value) || 0,
    }));
    d.vacancyPct = Number(el('m-vacancy').value) || 5;
  }
  if (step === 3) {
    REPAIR_ITEMS.slice(0, 8).forEach(item => {
      if (!d.repairs[item.key]) d.repairs[item.key] = {};
      d.repairs[item.key].condition = document.querySelector(`.qc-cond[data-key="${item.key}"]`)?.value || 'good';
      d.repairs[item.key].cost      = Number(document.querySelector(`.qc-cost[data-key="${item.key}"]`)?.value) || 0;
    });
    d.schoolDistrict = el('m-school').value.trim();
    d.notes          = el('m-notes').value.trim();
  }
}

function updateModalStepView() {
  const step = state.modalStep;
  document.querySelectorAll('.mstep').forEach((el, i) => el.classList.toggle('hidden', i !== step));
  document.querySelectorAll('.sdot').forEach((el, i) => {
    el.classList.toggle('active', i === step);
    el.classList.toggle('done',   i < step);
  });
  el('modal-sub').textContent = `Step ${step + 1} of 4 — ${['Basic Info', 'Financial', 'Units & Rental', 'Condition'][step]}`;
  el('modal-prev').disabled   = step === 0;
  el('modal-next').textContent = step === 3 ? 'Save Property ✓' : 'Next →';

  // Build dynamic step content
  const d = window._modalDraft;
  if (!d) return;
  if (step === 1) { fillModalStep1(d); }
  if (step === 2) { buildUnitsForm(numUnitsForType(d.propertyType), d.units); }
  if (step === 3) { buildConditionGrid(d.repairs); el('m-school').value = d.schoolDistrict || ''; el('m-notes').value = d.notes || ''; }
}

function saveModalProperty() {
  const d = window._modalDraft;
  if (!d) return;
  if (!d.address) { showToast('Please enter an address.', 'error'); return; }
  d.updatedAt = new Date().toISOString();

  if (state.editingId) {
    const idx = state.properties.findIndex(p => p.id === state.editingId);
    if (idx >= 0) state.properties[idx] = d;
  } else {
    state.properties.unshift(d);
  }
  save();
  state.activeId = d.id;
  state.view = 'property';
  state.activeTab = 'overview';
  closeModal();
  renderAll();
  showToast(state.editingId ? 'Property updated!' : 'Property added! 🎉');
}

// ── EVENT WIRING ──────────────────────────────────────────────────────────────

function init() {
  load();

  // URL bar
  el('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') doAnalyze(); });
  el('analyze-btn').addEventListener('click', doAnalyze);

  async function doAnalyze() {
    const url = el('url-input').value.trim();
    if (!url) { showToast('Paste a listing URL first.', 'error'); return; }

    const platform = detectPlatform(url);
    const badge    = el('url-badge');

    // Immediately extract what the URL slug tells us
    const urlData = extractFromURL(url);

    // Inherit financial defaults from the most recent property
    const prev = state.properties[0];
    const p = defaultProperty(url);
    Object.assign(p, urlData);
    if (prev) {
      p.downPct    = prev.downPct;
      p.rate       = prev.rate;
      p.term       = prev.term;
      p.insAnnual  = prev.insAnnual  || p.insAnnual;
      p.maintPct   = prev.maintPct  || 1;
      p.vacancyPct = prev.vacancyPct || 5;
    }

    // Show immediately — optimistic render
    state.properties.unshift(p);
    save();
    state.activeId  = p.id;
    state.view      = 'property';
    state.activeTab = 'overview';
    el('url-input').value = '';
    renderAll();

    // Background fetch from the listing site
    if (badge) { badge.textContent = `⏳ Reading from ${platform}…`; badge.classList.remove('hidden'); }
    el('analyze-btn').disabled = true;

    // MLS feed/notification links can't be auto-read — tell them to use quick fill
    if (isMlsFeedUrl(url)) {
      setTimeout(() => {
        if (badge) badge.classList.add('hidden');
        el('analyze-btn').disabled = false;
        showToast('MLS feed link detected — fill in property details below ↓', 'warn');
      }, 1200);
      return;
    }

    try {
      const fetched = await fetchListingData(url);
      if (fetched && (fetched.address || fetched.price)) {
        const idx = state.properties.findIndex(x => x.id === p.id);
        if (idx >= 0) {
          const merged = { ...state.properties[idx], ...fetched, id: p.id, createdAt: p.createdAt, url };
          // Keep inherited financials if fetch didn't return them
          if (!fetched.downPct) merged.downPct = p.downPct;
          if (!fetched.rate)    merged.rate    = p.rate;
          if (!fetched.term)    merged.term    = p.term;
          state.properties[idx] = merged;
          save();
          if (state.activeId === p.id) renderPropertyDetail();
          renderSidebar();
          showToast(`✓ Listing data loaded from ${platform}!`);
        }
      } else {
        showToast(`${platform} couldn't be auto-read — fill in details below.`, 'warn');
      }
    } catch(e) {
      showToast('Enter details in the Edit form or Financials tab.', 'warn');
    } finally {
      if (badge) badge.classList.add('hidden');
      el('analyze-btn').disabled = false;
    }
  }

  // Modal nav
  el('modal-next').addEventListener('click', () => {
    readModalStep(state.modalStep);
    if (state.modalStep < 3) {
      state.modalStep++;
      updateModalStepView();
    } else {
      saveModalProperty();
    }
  });
  el('modal-prev').addEventListener('click', () => {
    if (state.modalStep > 0) { state.modalStep--; updateModalStepView(); }
  });
  el('modal-close').addEventListener('click', closeModal);
  el('modal-overlay').addEventListener('click', e => { if (e.target === el('modal-overlay')) closeModal(); });

  // Live calc on step 2
  ['m-price','m-down','m-rate','m-term','m-tax','m-ins'].forEach(id => {
    const e = el(id); if (e) e.addEventListener('input', updateLiveCalc);
  });

  // Tab nav
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      state.activeTab = btn.dataset.tab;
      const pane = el(`tab-${btn.dataset.tab}`);
      if (pane) pane.classList.remove('hidden');
      renderActiveTab();
    });
  });

  // Back buttons
  el('detail-back-btn').addEventListener('click', () => { state.view = 'dashboard'; state.activeId = null; renderAll(); });
  el('compare-back-btn').addEventListener('click', () => { state.view = 'dashboard'; state.compareMode = false; renderAll(); });

  // Status changer
  el('d-status-select').addEventListener('change', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    p.status = el('d-status-select').value;
    p.updatedAt = new Date().toISOString();
    save();
    el('d-status-badge').className = `status-badge s-${p.status}`;
    el('d-status-badge').textContent = STATUS_LABELS[p.status];
    renderSidebar();
    showToast('Status updated.');
  });

  // Edit button
  el('d-edit-btn').addEventListener('click', () => { openModal(null, state.activeId); });

  // Delete button
  el('d-delete-btn').addEventListener('click', () => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    state.properties = state.properties.filter(p => p.id !== state.activeId);
    save();
    state.activeId = null;
    state.view = 'dashboard';
    renderAll();
    showToast('Property deleted.', 'error');
  });

  // Stars display (click to set rating)
  el('d-stars-display').querySelectorAll('.star').forEach(s => {
    s.addEventListener('click', () => {
      const p = state.properties.find(x => x.id === state.activeId);
      if (!p) return;
      p.rating = Number(s.dataset.v);
      save();
      renderStarsDisplay(p.rating);
      if (state.view === 'property') renderSidebar();
      showToast('Rating saved.');
    });
  });

  // Star input (notes tab)
  document.querySelectorAll('#star-input .si').forEach(s => {
    s.addEventListener('click', () => {
      const p = state.properties.find(x => x.id === state.activeId);
      if (!p) return;
      p.rating = Number(s.dataset.v);
      save();
      renderStarInput(p.rating);
      renderStarsDisplay(p.rating);
    });
  });

  // Filter sidebar
  el('filter-status').addEventListener('change', () => {
    state.filterStatus = el('filter-status').value;
    renderSidebar();
  });

  // Compare toggle
  el('compare-toggle-btn').addEventListener('click', () => {
    state.compareMode = !state.compareMode;
    if (state.compareMode) {
      el('compare-toggle-btn').style.background = 'rgba(212,168,67,0.2)';
      el('compare-toggle-btn').style.color = 'var(--gold-light)';
    } else {
      el('compare-toggle-btn').style.background = '';
      el('compare-toggle-btn').style.color = '';
      state.compareIds = [];
      if (state.view === 'compare') { state.view = 'dashboard'; }
    }
    renderAll();
  });

  // Show compare view
  el('compare-toggle-btn').addEventListener('dblclick', () => {
    if (state.compareIds.length >= 2) { state.view = 'compare'; renderAll(); }
    else { showToast('Select at least 2 properties first.', 'error'); }
  });

  // Financials tab recalc
  el('fi-recalc-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    p.price        = Number(el('fi-price').value)    || p.price;
    p.downPct      = Number(el('fi-down').value)     || p.downPct;
    p.rate         = Number(el('fi-rate').value)     || p.rate;
    p.term         = Number(el('fi-term').value)     || p.term;
    p.taxAnnual    = Number(el('fi-tax').value)      || 0;
    p.insAnnual    = Number(el('fi-insurance').value)|| 0;
    p.hoaMonthly   = Number(el('fi-hoa').value)      || 0;
    const units    = p.units || [];
    const newRent  = Number(el('fi-rent').value) || 0;
    if (units.length > 1) units[1].rent = newRent;
    p.updatedAt = new Date().toISOString();
    save();
    renderFinCalc(p);
    showToast('Financials recalculated.');
  });

  // Save repairs
  el('save-repairs-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    if (!p.repairs) p.repairs = {};
    REPAIR_ITEMS.forEach(item => {
      if (!p.repairs[item.key]) p.repairs[item.key] = {};
      const condEl = document.querySelector(`.ri-cond[data-key="${item.key}"]`);
      const ageEl  = document.querySelector(`.ri-age[data-key="${item.key}"]`);
      const costEl = document.querySelector(`.ri-cost[data-key="${item.key}"]`);
      if (condEl) p.repairs[item.key].condition = condEl.value;
      if (ageEl)  p.repairs[item.key].age       = ageEl.value;
      if (costEl) p.repairs[item.key].cost      = Number(costEl.value) || 0;
    });
    // Save other items
    const others = [];
    document.querySelectorAll('.oi-desc').forEach((descEl, i) => {
      const costEl = document.querySelector(`.oi-cost[data-i="${i}"]`);
      others.push({ description: descEl.value, cost: Number(costEl?.value) || 0 });
    });
    p.repairs.other = others;
    p.updatedAt = new Date().toISOString();
    save();
    renderRepairsSidebar(p);
    renderSidebar();
    showToast('Repairs saved!');
  });

  // Add other repair item
  el('add-other-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    if (!p.repairs.other) p.repairs.other = [];
    p.repairs.other.push({ description: '', cost: 0 });
    renderOtherItems(p.repairs.other);
  });

  // Save location
  el('save-loc-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    p.schoolDistrict  = el('loc-school').value.trim();
    p.locationNotes   = el('loc-notes').value.trim();
    p.updatedAt = new Date().toISOString();
    save();
    showToast('Location info saved.');
  });

  // Add comp
  el('add-comp-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    if (!p.comps) p.comps = [];
    p.comps.push({ address: '', price: 0, sqft: 0, taxAnnual: 0, notes: '' });
    save();
    renderComps(p);
  });

  // Delegate comp save on blur
  document.getElementById('comps-tbody').addEventListener('change', saveComps);

  // Save notes
  el('save-notes-btn').addEventListener('click', () => {
    const p = state.properties.find(x => x.id === state.activeId);
    if (!p) return;
    p.pros  = el('n-pros').value;
    p.cons  = el('n-cons').value;
    p.notes = el('n-notes').value;
    p.updatedAt = new Date().toISOString();
    save();
    showToast('Notes saved!');
  });

  renderAll();
}

// Expose globals for inline event handlers
window.clickPropCard  = clickPropCard;
window.toggleCompare  = toggleCompare;
window.removeComp     = removeComp;
window.removeOtherItem= removeOtherItem;
window.updateRepairTotal = updateRepairTotal;

document.addEventListener('DOMContentLoaded', init);
