// src/sportsSouthClient.js
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

const WS_BASE = 'http://webservices.theshootingwarehouse.com/smart';
const {
  SPORTS_SOUTH_USERNAME,
  SPORTS_SOUTH_PASSWORD,
  SPORTS_SOUTH_CUSTOMER_NUMBER,
  SPORTS_SOUTH_SOURCE
} = process.env;

async function fetchSportsSouthInventory(sinceIso = '1990-01-01T00:00:00Z') {
  if (!SPORTS_SOUTH_USERNAME || !SPORTS_SOUTH_PASSWORD || !SPORTS_SOUTH_CUSTOMER_NUMBER || !SPORTS_SOUTH_SOURCE) {
    throw new Error('❌ Missing one or more required Sports South credentials in environment variables.');
  }

  const resp = await axios.get(`${WS_BASE}/inventory.asmx/IncrementalOnhandUpdate`, {
    params: {
      UserName:       SPORTS_SOUTH_USERNAME,
      Password:       SPORTS_SOUTH_PASSWORD,
      CustomerNumber: SPORTS_SOUTH_CUSTOMER_NUMBER,
      Source:         SPORTS_SOUTH_SOURCE,
      SinceDateTime:  sinceIso
    },
    headers: { 'Accept': 'text/xml' }
  });

  // This line to inspect raw XML
  console.log('📩 Raw Sports South XML:', resp.data.slice(0, 500)); // just a preview

  const parsed = await xml2js.parseStringPromise(resp.data, { explicitArray: false });

  // TEMP: Log the fully parsed object
  console.dir(parsed, { depth: 5 });

  const items = parsed?.NewDataSet?.Table1;
  console.log('📦 Parsed item count:', Array.isArray(items) ? items.length : 0);

  return items ? (Array.isArray(items) ? items : [items]) : [];
}

module.exports = { fetchSportsSouthInventory };
