const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');

const hashWritten = {};

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const HashDataWriter = async (id, key, data) => {
    const isRaw = ArrayBuffer.isView(data);
    const bulkPath = HashDataWriter.createHashPath(data);
    const gzip = bulkPath.indexOf('.gz')!=-1;
    const absolutePath = path.join(id.sopInstanceRootPath, bulkPath);
    const dirName = path.dirname(absolutePath)
    if( hashWritten[bulkPath] ) return;
    hashWritten[bulkPath] = true;
    console.log('HashDataWriter', key,' to', absolutePath);
    if(!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
    }
    const rawStream = fs.createWriteStream(absolutePath)
    let writeStream = rawStream;
    if( gzip ) {
        const writeStream = zlib.createGzip();
        writeStream.pipe(rawStream);
    }
    const rawData = isRaw ? data : JSON.stringify(data, null, 1);
    await writeStream.write(rawData);
    writeStream.end();
    return bulkPath;
}

/**
 * Returns a hash path relative to the objectUID directory.
 */
HashDataWriter.createHashPath = (data) => {
    const isRaw = ArrayBuffer.isView(data);
    const gzip = !isRaw || data.length > 1024;
    const extension = (isRaw ? '.raw' : '.json') + (gzip && '.gz');
    const hashValue = hash(data);
    return path.join('../../../../bulkdata/',hashValue.substring(0,3),hashValue.substring(3,5),hashValue.substring(5) + extension);
}

module.exports = HashDataWriter;
