// src/sportsSouthClient.js
require('dotenv').config();
const axios  = require('axios');
const xml2js = require('xml2js');

const WS_BASE = 'http://webservices.theshootingwarehouse.com/smart';
const {
  SS_USERNAME,
  SS_PASSWORD,
  SS_CUSTOMER_NUMBER,
  SS_SOURCE
} = process.env;

async function fetchSportsSouthInventory(sinceIso = '1990-01-01T00:00:00Z') {
  // Call the GET interface
  const resp = await axios.get(
    `${WS_BASE}/inventory.asmx/IncrementalOnhandUpdate`,
    {
      params: {
        UserName:       SS_USERNAME,
        Password:       SS_PASSWORD,
        CustomerNumber: SS_CUSTOMER_NUMBER,
        Source:         SS_SOURCE,
        SinceDateTime:  sinceIso
      },
      headers: { 'Accept': 'text/xml' }
    }
  );

  // Parse the returned XML
  const outer = await xml2js.parseStringPromise(resp.data, { explicitArray: false });
  const items = outer
    ?.Envelope
    ?.Body
    ?.IncrementalOnhandUpdateResponse
    ?.IncrementalOnhandUpdateResult
    ?.Inventory
    ?.Item;

  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

module.exports = { fetchSportsSouthInventory };
