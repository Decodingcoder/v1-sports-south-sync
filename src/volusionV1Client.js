// src/volusionV1Client.js
require('dotenv').config();
const axios  = require('axios');
const xml2js = require('xml2js');

async function fetchVolusionProducts() {
  // Build the URL string in one template literal
  const url = `${process.env.VOLUSION_STORE_URL}/net/WebService.aspx`
    + `?Login=${encodeURIComponent(process.env.VOLUSION_EMAIL)}`
    + `&EncryptedPassword=${encodeURIComponent(process.env.VOLUSION_ENCRYPTED_PASSWORD)}`
    + `&EDI_Name=Generic%5CProducts`;

  console.log('→ Volusion GET URL:', url);

  try {
    const res = await axios.get(url, { timeout: 15000 });
    // res.data may include some BOM or comments: strip anything before the first '<'
    const xml = res.data.replace(/^[^<]*/, '');
    // parse the XML
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const prods = parsed?.xml?.Products?.Product;
    return Array.isArray(prods) ? prods : (prods ? [prods] : []);
  } catch (err) {
    console.error('Volusion fetch failed:', err.message);
    return [];
  }
}

module.exports = { fetchVolusionProducts };
