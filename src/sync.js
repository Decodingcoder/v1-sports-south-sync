// src/sync.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { fetchSportsSouthInventory } = require('./sportsSouthClient');
const { fetchHicksInventory } = require('./hicksIncClient');
const { generateVolusionCSV } = require('./generateCSV');

const lastSyncPath = path.resolve(__dirname, '../lastSync.json');

// 1) Determine `since`
let sinceIso = '1990-01-01T00:00:00Z';
if (fs.existsSync(lastSyncPath)) {
  try {
    const { since } = JSON.parse(fs.readFileSync(lastSyncPath, 'utf8'));
    if (since) sinceIso = since;
  } catch (_) {}
}

;(async () => {
  console.log(`⏳ Fetching Sports South since ${sinceIso}...`);
  const ssItems = await fetchSportsSouthInventory(sinceIso);
  console.log(`✅ Sports South returned ${ssItems.length} items.`);

  console.log(`⏳ Fetching Hicks Inc since ${sinceIso}...`);
  const hiItems = await fetchHicksInventory();
  console.log(`✅ Hicks Inc returned ${hiItems.length} items.`);

  // 2) Normalize both sources to { code, qty }
  const ssNorm = ssItems.map(i => ({
    code: i.ItemNo,
    qty: Number(i.Quantity)
  }));

  const hiNorm = hiItems.map(i => ({
    code: i.sku,
    qty: Number(i.onHand)
  }));

  // 3) Merge and sum inventory quantities
  const combined = [...ssNorm, ...hiNorm];
  const agg = combined.reduce((acc, { code, qty }) => {
    if (!code) return acc;
    acc[code] = (acc[code] || 0) + (isNaN(qty) ? 0 : qty);
    return acc;
  }, {});

  // 4) Build final CSV structure
  const updates = Object.entries(agg).map(([ProductCode, qty]) => ({
    ProductCode,
    StockStatus: qty > 0 ? 'In Stock' : 'Out of Stock'
  }));

  // 5) Write CSV
  const csvPath = path.resolve(__dirname, '../volusion-upload.csv');
  await generateVolusionCSV(updates, csvPath);

  // 6) Update lastSync
  fs.writeFileSync(lastSyncPath,
    JSON.stringify({ since: new Date().toISOString() }, null, 2)
  );
  console.log(`✅ Sync complete. Next run will start from this point.`);
})();
