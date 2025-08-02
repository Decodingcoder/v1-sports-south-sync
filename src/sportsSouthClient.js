// ──────────────────────────────────────────────
// src/sportsSouthClient.js
// ──────────────────────────────────────────────
require('dotenv').config();
const xml2js = require('xml2js');
const soap   = require('soap');

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
  const wsdl = 'http://webservices.theshootingwarehouse.com/smart/inventory.asmx?WSDL';

  // Use HTTP Basic Auth for WSDL file itself
  const client = await soap.createClientAsync(wsdl, {
    wsdl_options: {
      rejectUnauthorized: false,
      auth: `${SPORTS_SOUTH_USERNAME}:${SPORTS_SOUTH_PASSWORD}`,
    },
  });

  console.log('Username:', process.env.SPORTS_SOUTH_USERNAME)
console.log('Password:', process.env.SPORTS_SOUTH_PASSWORD)
console.log('CustomerNumber:', process.env.SPORTS_SOUTH_CUSTOMER_NUMBER)
console.log('Source:', process.env.SPORTS_SOUTH_SOURCE)


  const args = {
    UserName:       SPORTS_SOUTH_USERNAME,
    Password:       SPORTS_SOUTH_PASSWORD,
    CustomerNumber: SPORTS_SOUTH_CUSTOMER_NUMBER,
    Source:         SPORTS_SOUTH_SOURCE,
    SinceDateTime:  sinceIso,
  };

  const [result] = await client.IncrementalOnhandUpdateAsync(args);
  const rawXml = result.IncrementalOnhandUpdateResult;

  const parsed = await xml2js.parseStringPromise(rawXml, { explicitArray: false });
  const items = parsed?.NewDataSet?.Inventory;

  console.log('Raw XML result from Sports South:\n', rawXml);

  if (!items) return [];

  const list = Array.isArray(items) ? items : [items];
  return list.map(it => ({
    ItemNo: it.ITEMNO,
    Quantity: Number(it.ONHAND)
  }));
}

module.exports = { fetchSportsSouthInventory };
