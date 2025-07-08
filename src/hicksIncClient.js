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
    await client.access({
      host:     HICKS_FTP_HOST,
      user:     HICKS_FTP_USER,
      password: HICKS_FTP_PASS,
      port:     21,
      secure:   false,
      passive:  true,
    });

    // navigate into the folder
    await client.cd('fh');

    // download the correctly‑cased file
    const tmpPath = path.resolve(__dirname, '../tmp/hicks-full.csv');
    await client.downloadTo(tmpPath, 'full_V2.csv');

    // read & parse
    const fileContent = fs.readFileSync(tmpPath, 'utf8');
    const records = parse(fileContent, {
      columns:          true,
      skip_empty_lines: true,
    });

    // normalize to { sku, onHand }
    return records
      .map(row => ({
        sku:    row.ItemNo,
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
