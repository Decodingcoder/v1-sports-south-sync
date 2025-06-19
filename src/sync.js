// src/sync.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { fetchVolusionProducts } = require('./volusionV1Client');
const { fetchSportsSouthInventory } = require('./sportsSouthClient');
const { generateVolusionCSV } = require('./generateCSV');

// 1) Path to track last sync time
const lastSyncPath = path.resolve(__dirname, '../lastSync.json');

// 2) Read last sync or default to 1990
let lastSyncIso = '1990-01-01T00:00:00Z';
if (fs.existsSync(lastSyncPath)) {
  try {
    const { since } = JSON.parse(fs.readFileSync(lastSyncPath, 'utf8'));
    if (since) lastSyncIso = since;
  } catch (_) { /* ignore */ }
}

(async () => {
  console.log(`⏳ Fetching Sports South inventory...`);
  const ssInventory = await fetchSportsSouthInventory(lastSyncIso);
  console.log(`✅ Fetched ${ssInventory.length} Sports South items.`);

  if (!ssInventory || ssInventory.length === 0) {
    console.log('⚠️ No inventory returned. Exiting early.');
    return;
  }

  console.log('🔍 Sample item:', JSON.stringify(ssInventory[0], null, 2));

  // 3) Build updates
  const updates = ssInventory.map(item => {
    const productCode = item.ItemNo;
    const quantity = parseFloat(item.Quantity);

    if (!productCode || isNaN(quantity)) {
      console.warn('⚠️ Skipping item with missing ItemNo or Quantity:', item);
      return null;
    }

    return {
      ProductCode: productCode,
      StockStatus: quantity > 0 ? 'In Stock' : 'Out of Stock'
    };
  }).filter(Boolean);

  console.log(`🧮 ${updates.length} valid inventory items after filtering.`);

  // 4) Write CSV
  const csvPath = path.resolve(__dirname, '../volusion-upload.csv');
  const csv = generateVolusionCSV(updates);
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(`📦 Wrote ${updates.length} rows to volusion-upload.csv`);

  // 5) Update last sync time
  fs.writeFileSync(lastSyncPath, JSON.stringify({ since: new Date().toISOString() }, null, 2));
})();
