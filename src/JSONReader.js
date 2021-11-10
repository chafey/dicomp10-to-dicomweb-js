const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const JSONReader = async (dir, name, def) => {
    let finalData;
    try {
        let rawdata = fs.readFileSync(path.join(dir, name));
        if (name.indexOf('.gz') != -1) {
            finalData = zlib.gunzipSync(rawdata).toString('utf-8');
        } else {
            finalData = rawdata;
        }
    } catch (err) {
        console.log('Couldn\'t read', dir, name);
    }
    return finalData && JSON.parse(finalData) || def;
};

module.exports = JSONReader;