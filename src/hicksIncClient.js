// src/hicksIncClient.js
require('dotenv').config();
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync').parse;

const {
  HICKS_FTP_HOST,
  HICKS_FTP_USER,
  HICKS_FTP_PASS
} = process.env;

// ✅ Log after loading from process.env
console.log('🔍 FTP ENV:', {
  host: HICKS_FTP_HOST,
  user: HICKS_FTP_USER,
  pass: HICKS_FTP_PASS ? '***' : undefined
});

async function fetchHicksInventory() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: HICKS_FTP_HOST,
      user: HICKS_FTP_USER,
      password: HICKS_FTP_PASS,
      port: 21,
      secure: false
    });

    const tempFile = path.resolve(__dirname, '../tmp/hicks-full.csv');
    await client.downloadTo(tempFile, '/fh/full_v2.csv');

    const fileContent = fs.readFileSync(tempFile, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Normalize result
    return records.map(row => ({
      sku: row.ItemNo,
      onHand: parseFloat(row.QtyOnHand)
    })).filter(r => r.sku);
  } catch (err) {
    console.error('❌ Failed to fetch Hicks inventory:', err.message);
    return [];
  } finally {
    client.close();
  }
}

module.exports = { fetchHicksInventory };
