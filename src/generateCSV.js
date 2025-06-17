const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function generateVolusionCSV(products, filePath = './volusion-upload.csv') {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: [
            { id: 'ProductCode', title: 'ProductCode' },
            { id: 'StockStatus', title: 'StockStatus' }
        ]
    });

    await csvWriter.writeRecords(products);
    console.log('✅ CSV created at', filePath);
}

module.exports = { generateVolusionCSV };