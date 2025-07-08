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
    // 1) Connect
    await client.access({
      host:     HICKS_FTP_HOST,
      user:     HICKS_FTP_USER,
      password: HICKS_FTP_PASS,
      port:     21,
      secure:   false,
      passive:  true,
    });

    // 2) Go into the fh folder
    await client.cd('fh');

    // 3) Download the full V2 CSV
    const tmpPath = path.resolve(__dirname, '../tmp/hicks-full.csv');
    await client.downloadTo(tmpPath, 'full_V2.csv');

    // 4) Read it as text
    const fileContent = fs.readFileSync(tmpPath, 'utf8');

    // 👇 Log the raw header line so we can see exact column names
    console.log('🗒️ Hicks CSV header:', fileContent.split('\n')[0]);

    // 5) Parse into objects
    const records = parse(fileContent, {
      columns:          true,
      skip_empty_lines: true,
    });

    // 6) Map to our shape using the exact column names you’ll see in the log above
    return records
      .map(row => ({
        sku:    row['Item number'],        // use exactly what the header log shows
        onHand: parseFloat(row['Quantity on hand'])
      }))
      .filter(r => r.sku);

  } catch (err) {
    console.error('❌ Failed to fetch Hicks inventory:', err.message);
    return [];
  } finally {
    client.close();
  }
}

module.exports = { fetchHicksInventory };
