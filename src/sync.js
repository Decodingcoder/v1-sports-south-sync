// src/sync.js
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const { fetchVolusionProducts }    = require('./volusionV1Client');
const { fetchSportsSouthInventory } = require('./sportsSouthClient');
const { generateVolusionCSV }      = require('./generateCSV');

// 1) Where to store our last‑sync timestamp
const lastSyncPath = path.resolve(__dirname, '../lastSync.json');

// 2) Read lastSync; default to 1990‑01‑01 if missing
let lastSyncIso = '1990-01-01T00:00:00Z';
if (fs.existsSync(lastSyncPath)) {
  try {
    const { since } = JSON.parse(fs.readFileSync(lastSyncPath, 'utf8'));
    if (since) lastSyncIso = since;
  } catch (_) { /* ignore parse errors */ }
}

(async () => {
  console.log(`⏳ Fetching Volusion products...`);
  const ssInventory = await fetchSportsSouthInventory();
console.log(`✅ Fetched ${ssInventory.length} Sports South items.`);

// Build updates for *every* Sports South item
const updates = ssInventory.map(item => ({
    // adjust these keys if your CSV importer expects different column names:
    ProductCode: item.ItemNo,
    StockStatus: item.Quantity > 0 ? 'In Stock' : 'Out of Stock'
}));

})();
