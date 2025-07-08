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
    // 1) connect & login
    await client.access({
      host:     HICKS_FTP_HOST,
      user:     HICKS_FTP_USER,
      password: HICKS_FTP_PASS,
      port:     21,
      secure:   false,
      passive:  true,
    });

    // 2) debug: list root directory
    console.log('📂 Root files:', (await client.list()));

    // 3) move into "From Hicks"
    await client.cd('fh');

    // 4) debug: list /fh contents
    console.log('📂 /fh files:', (await client.list()));

    // 5) download the CSV
    const tmpPath = path.resolve(__dirname, '../tmp/hicks-full.csv');
    await client.downloadTo(tmpPath, 'full_v2.csv');

    // 6) parse it
    const fileContent = fs.readFileSync(tmpPath, 'utf8');
    const records = parse(fileContent, {
      columns:           true,
      skip_empty_lines:  true
    });

    // 7) normalize for your sync.js
    return records
      .map(row => ({
        sku:    row.ItemNo,
        onHand: parseFloat(row['Quantity on hand'] ?? row.QtyOnHand)
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
