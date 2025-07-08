const fs = require('fs');
const { create } = require('xmlbuilder2');

async function generateVolusionXML(products, filePath = './volusion-upload.xml') {
  const root = create({ version: '1.0' })
    .ele('xmldata');

  products.forEach(({ ProductCode, StockStatus }) => {
    root.ele('product')
      .ele('ProductCode').txt(ProductCode).up()
      .ele('StockStatus').txt(StockStatus).up()
      .up();
  });

  const xml = root.end({ prettyPrint: true });
  fs.writeFileSync(filePath, xml, 'utf8');
  console.log('✅ XML created at', filePath);
}

module.exports = { generateVolusionXML };
