// src/hicksClient.js
require('dotenv').config();
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function fetchHicksInventory() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const localFile = path.resolve(__dirname, '../tmp/hicks-full.csv');

  try {
    await client.access({
      host: process.env.HICKS_FTP_HOST,
      user: process.env.HICKS_FTP_USER,
      password: process.env.HICKS_FTP_PASS,
      secure: false,
    });

    await client.downloadTo(localFile, 'full_v2.csv');
    await client.close();

    const items = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(localFile)
        .pipe(csv())
        .on('data', (row) => {
          const productCode = row['ItemNo'];
          const qty = parseFloat(row['QtyOnHand']);

          if (!productCode || isNaN(qty)) return;
          items.push({
            ProductCode: productCode,
            StockStatus: qty > 0 ? 'In Stock' : 'Out of Stock'
          });
        })
        .on('end', () => resolve(items))
        .on('error', reject);
    });

  } catch (err) {
    console.error('❌ Failed to fetch Hicks inventory:', err);
    return [];
  }
}

module.exports = { fetchHicksInventory };
