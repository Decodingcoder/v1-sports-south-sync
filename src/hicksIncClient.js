// src/hicksIncClient.js
require('dotenv').config();
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync').parse;

async function fetchHicksInventory() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  // ✅ Fetch env inside function
  const {
    HICKS_FTP_HOST,
    HICKS_FTP_USER,
    HICKS_FTP_PASS
  } = process.env;

  console.log('🔍 FTP ENV:', {
    host: HICKS_FTP_HOST,
    user: HICKS_FTP_USER,
    pass: HICKS_FTP_PASS ? '***' : undefined
  });

  try {
    await client.access({
      host: HICKS_FTP_HOST,
      user: HICKS_FTP_USER,
      password: HICKS_FTP_PASS,
      port: 21,
      secure: false
      passive: true  // 👈 Force passive mode
    });

    // 🧪 Log root files
    console.log('📂 Root files:', await client.list('/'));

    // 🧪 Log files inside /fh
    try {
      console.log('📂 /fh directory contents:', await client.list('/fh'));
    } catch (err) {
      console.error('⚠️ Could not list /fh directory:', err.message);
    }

    // Skip downloading for now
    return [];

    const fileContent = fs.readFileSync(tempFile, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

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
