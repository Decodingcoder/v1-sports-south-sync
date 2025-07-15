// src/sportsSouthClient.js
require('dotenv').config();
const soap = require('strong-soap').soap;

const {
  SPORTS_SOUTH_USERNAME,
  SPORTS_SOUTH_PASSWORD,
  SPORTS_SOUTH_CUSTOMER_NUMBER,
  SPORTS_SOUTH_SOURCE
} = process.env;

const INVENTORY_WSDL_URL = 'https://webservices.theshootingwarehouse.com/smart/inventory.asmx?WSDL';

async function fetchSportsSouthInventory(sinceIso = '1990-01-01T00:00:00Z') {
  return new Promise((resolve, reject) => {
    soap.createClient(INVENTORY_WSDL_URL, {}, (err, client) => {
      if (err) {
        console.error('❌ SOAP client error:', err.message);
        return reject(err);
      }

      const args = {
        userName: SPORTS_SOUTH_USERNAME,
        password: SPORTS_SOUTH_PASSWORD,
        customerNumber: SPORTS_SOUTH_CUSTOMER_NUMBER,
        source: SPORTS_SOUTH_SOURCE,
        lastUpdateDate: sinceIso
      };

      console.log('📡 Calling Sports South GetInventory with args:', args);

      client.GetInventory(args, (err, result) => {
        if (err) {
          console.error('❌ Sports South inventory fetch failed:', err.message);
          return reject(err);
        }

        const rawXml = result.GetInventoryResult;
        console.log('📩 Raw XML received');

        // Parse embedded XML string
        const parseString = require('xml2js').parseString;
        parseString(rawXml, { explicitArray: false }, (err, parsed) => {
          if (err) {
            console.error('❌ Failed to parse inventory XML:', err.message);
            return reject(err);
          }

          const items = parsed?.NewDataSet?.Table;
          const normalized = Array.isArray(items) ? items : items ? [items] : [];

          console.log(`✅ Parsed ${normalized.length} Sports South items`);
          resolve(normalized);
        });
      });
    });
  });
}

module.exports = { fetchSportsSouthInventory };
