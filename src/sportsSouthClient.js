// ────────────────────────────────────────────────────────────────
// src/sportsSouthClient.js
// Fetch & parse Sports South inventory (IncrementalOnhandUpdate)
// ────────────────────────────────────────────────────────────────
require('dotenv').config();
const xml2js = require('xml2js');
const soap   = require('strong-soap').soap;

const {
  SPORTS_SOUTH_USERNAME,
  SPORTS_SOUTH_PASSWORD,
  SPORTS_SOUTH_CUSTOMER_NUMBER,
  SPORTS_SOUTH_SOURCE,
} = process.env;

/**
 * Pull only the **delta** since the timestamp you pass in.
 * @param {string} sinceIso   e.g. "1990-01-01T00:00:00Z"  (full dump)
 * @returns {Promise<Array<{ ItemNo:string, Quantity:number }>>}
 */
async function fetchSportsSouthInventory(sinceIso) {
  const wsdl = 'https://webservices.theshootingwarehouse.com/smart/inventory.asmx?WSDL';

  // wrap strong‑soap’s callback API in a Promise:
  const client = await soap.createClientAsync(wsdl, {
    wsdl_options: {
      rejectUnauthorized: false
        }
      });

  // strong‑soap wants “IncrementalOnhandUpdate” exactly as below ⤵
  const args = {
    UserName:       SPORTS_SOUTH_USERNAME,
    Password:       SPORTS_SOUTH_PASSWORD,
    CustomerNumber: SPORTS_SOUTH_CUSTOMER_NUMBER,
    Source:         SPORTS_SOUTH_SOURCE,
    SinceDateTime:  sinceIso,
  };

  const rawXml = await new Promise((res, rej) =>
    client.IncrementalOnhandUpdate(args, (err, result) =>
      err ? rej(err) : res(result.IncrementalOnhandUpdateResult)
    )
  );

  // rawXml is a plain XML string.  Parse it:
  const parsed = await xml2js.parseStringPromise(rawXml, { explicitArray: false });

  /** 
   * Path is:
   * parsed.NewDataSet.Inventory   ⟶ can be single object **or** array
   */
  const items = parsed?.NewDataSet?.Inventory;
  if (!items) return [];

  const list = Array.isArray(items) ? items : [items];

  // Normalise into { ItemNo, Quantity }
  return list.map(it => ({
    ItemNo:   it.ITEMNO,
    Quantity: Number(it.ONHAND),
  }));
}

module.exports = { fetchSportsSouthInventory };
