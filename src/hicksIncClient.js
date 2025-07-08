// src/hicksIncClient.js
require('dotenv').config();
const ftp   = require('basic-ftp');
const fs    = require('fs');
const path  = require('path');
const parse = require('csv-parse/sync').parse;

async function fetchHicksInventory() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const {
    HICKS_FTP_HOST,
    HICKS_FTP_USER,
    HICKS_FTP_PASS
  } = process.env;

  console.log('🔍 FTP ENV:', {
    host: HICKS_FTP_HOST,
    user: HICKS_FTP_USER,
    pass:   HICKS_FTP_PASS ? '***' : undefined,
  });

  try {
    // 1) Connect & go to /fh
    await client.access({ host: HICKS_FTP_HOST, user: HICKS_FTP_USER, password: HICKS_FTP_PASS, port: 21, secure: false, passive: true });
    await client.cd('fh');

    // 2) Download V2 CSV
    const tmpPath = path.resolve(__dirname, '../tmp/hicks-full.csv');
    await client.downloadTo(tmpPath, 'full_V2.csv');

    // 3) Read entire file
    const fileContent = fs.readFileSync(tmpPath, 'utf8');

    // 4) Parse without headers => each record is an array of columns
    const records = parse(fileContent, {
      delimiter: ',',
      skip_empty_lines: true
    });

    // 5) Map by index: [1]=Item number, [18]=Quantity on hand
    const out = records.map(cols => ({
      sku:    cols[1]?.replace(/"/g, '').trim(),    // strip quotes/spaces
      onHand: parseFloat(cols[18]) || 0
    })).filter(r => r.sku);

    console.log(`✅ Parsed ${out.length} Hicks items.`);
    return out;

  } catch (err) {
    console.error('❌ Failed to fetch Hicks inventory:', err.message);
    return [];
  } finally {
    client.close();
  }
}

module.exports = { fetchHicksInventory };
