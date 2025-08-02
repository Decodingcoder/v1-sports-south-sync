// src/sync.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { fetchSportsSouthInventory } = require('./sportsSouthClient');
const { fetchHicksInventory } = require('./hicksIncClient');
const { generateVolusionXML } = require('./generateVolusionXML');

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


  // 🚨 NEW: Skip upload if nothing to update
  if (updates.length === 0) {
    console.log('⚠️ No inventory updates to upload. Skipping Volusion push.');
    return;
  }
  

  // 5) Write CSV
  const xmlPath = path.resolve(__dirname, '../volusion-upload.xml');
  await generateVolusionXML(updates, xmlPath);

  // 5.5) Upload XML to Volusion (NEW ADDITION)
console.log('📤 Uploading XML to Volusion...');

const xmlString = fs.readFileSync(xmlPath, 'utf8');
const volusionUploadUrl = `${process.env.VOLUSION_STORE_URL}/net/WebService.aspx`;

const payload = new URLSearchParams({
  EncryptedPassword: process.env.VOLUSION_ENCRYPTED_PASSWORD,
  Email: process.env.VOLUSION_EMAIL,
  InventoryUpdate: xmlString,
});

try {
  const response = await axios.post(volusionUploadUrl, payload.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });

  console.log('✅ Volusion upload successful:', response.data);
} catch (error) {
  console.error('❌ Volusion upload failed:', error.message);
}


  // 6) Update lastSync
  fs.writeFileSync(lastSyncPath,
    JSON.stringify({ since: new Date().toISOString() }, null, 2)
  );
  console.log(`✅ Sync complete. Next run will start from this point.`);
})();
