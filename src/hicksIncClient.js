// src/hicksIncClient.js
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

const {
  HICKS_INC_API_URL,      // e.g. https://api.hicksinc.com/inventory
  HICKS_INC_API_KEY       // whatever auth they require
} = process.env;

async function fetchHicksIncInventory(sinceIso) {
  if (!HICKS_INC_API_URL || !HICKS_INC_API_KEY) {
    throw new Error('Missing HICKS_INC_API_URL or HICKS_INC_API_KEY in env');
  }

  const resp = await axios.get(HICKS_INC_API_URL, {
    params: { since: sinceIso },
    headers: { 
      'Authorization': `Bearer ${HICKS_INC_API_KEY}`,
      'Accept': 'application/json'
    }
  });

  // assume JSON: [ { sku: 'ABC123', onHand: 42 }, … ]
  return Array.isArray(resp.data) ? resp.data : [];
}

module.exports = { fetchHicksIncInventory };

