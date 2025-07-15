// src/sportsSouthClient.js
require('dotenv').config();
const path = require('path');
const soap = require('strong-soap').soap;

async function fetchSportsSouthInventory(sinceIso) {
  const {
    SPORTS_SOUTH_USERNAME,
    SPORTS_SOUTH_PASSWORD,
    SPORTS_SOUTH_CUSTOMER_NUMBER,
    SPORTS_SOUTH_SOURCE,
  } = process.env;

  return new Promise((resolve, reject) => {
    const url = 'https://webservices.theshootingwarehouse.com/smart/inventory.asmx?WSDL';

    soap.createClient(url, {}, (err, client) => {
      if (err) return reject(err);

      const requestArgs = {
        ID: SPORTS_SOUTH_USERNAME,
        Password: SPORTS_SOUTH_PASSWORD,
        CustomerNo: SPORTS_SOUTH_CUSTOMER_NUMBER,
        Source: SPORTS_SOUTH_SOURCE,
        UpdateDate: sinceIso, // e.g. '1990-01-01T00:00:00Z'
        InventoryType: 'A',   // A = All, D = Discontinued, N = New, U = Updated
      };

      client.GetInventory(requestArgs, (err, result) => {
        if (err) return reject(err);

        const rawXml = result.GetInventoryResult;
        // This response is a raw XML string. You’ll need to parse it separately
        console.log('📩 Raw response:', rawXml);
        resolve([]); // We'll parse this in the next step.
      });
    });
  });
}

module.exports = { fetchSportsSouthInventory };
