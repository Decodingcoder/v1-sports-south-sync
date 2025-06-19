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

  // Debug log
  console.log('📩 Raw response:', resp.data);

  if (resp.data.includes('Authentication Failed')) {
    throw new Error('❌ Sports South API authentication failed. Check your username/password/customer number/source values.');
  }

  // Attempt to parse full XML (even if wrapped in <string>)
  const parsed = await xml2js.parseStringPromise(resp.data, { explicitArray: false });

  const rawXml = parsed?.string?._ ?? '';
  if (!rawXml) {
    console.warn('⚠️ No inner XML returned in <string> wrapper.');
    return [];
  }

  const unwrapped = await xml2js.parseStringPromise(rawXml, { explicitArray: false });
  const items = unwrapped?.NewDataSet?.Table1;

  return items ? (Array.isArray(items) ? items : [items]) : [];
}

module.exports = { fetchSportsSouthInventory };
