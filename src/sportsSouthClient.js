// ──────────────────────────────────────────────
// src/sportsSouthClient.js
// ──────────────────────────────────────────────
require('dotenv').config();
const xml2js = require('xml2js');
const soap   = require('soap');          // ⬅️  use node‑soap here

const {
  SPORTS_SOUTH_USERNAME,
  SPORTS_SOUTH_PASSWORD,
  SPORTS_SOUTH_CUSTOMER_NUMBER,
  SPORTS_SOUTH_SOURCE,
} = process.env;

/**
 * Pull the delta inventory since `sinceIso`
 */
async function fetchSportsSouthInventory(sinceIso) {
  const wsdl = 'https://webservices.theshootingwarehouse.com/smart/inventory.asmx?WSDL';

  // node‑soap has createClientAsync
  const client = await soap.createClientAsync(wsdl, {
    wsdl_options: { rejectUnauthorized: false }
  });

  const args = {
    UserName:       SPORTS_SOUTH_USERNAME,
    Password:       SPORTS_SOUTH_PASSWORD,
    CustomerNumber: SPORTS_SOUTH_CUSTOMER_NUMBER,
    Source:         SPORTS_SOUTH_SOURCE,
    SinceDateTime:  sinceIso,
  };

  // node‑soap automatically adds “Async” helpers for each method
  const [ result ] = await client.IncrementalOnhandUpdateAsync(args);
  const rawXml = result.IncrementalOnhandUpdateResult;

  // parse XML ➝ JSON
  const parsed = await xml2js.parseStringPromise(rawXml, { explicitArray: false });
  const items  = parsed?.NewDataSet?.Inventory;
  if (!items) return [];

  const list = Array.isArray(items) ? items : [items];
  return list.map(it => ({
    ItemNo:   it.ITEMNO,
    Quantity: Number(it.ONHAND)
  }));
}

module.exports = { fetchSportsSouthInventory };
