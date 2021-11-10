const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');

const hashWritten = {};

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const HashDataWriter = async (id, key, data) => {
    const bulkPath = HashDataWriter.createHashPath(data);
    const absolutePath = path.join(id.sopInstanceRootPath, bulkPath);
    const dirName = path.dirname(absolutePath)
    if( hashWritten[bulkPath] ) return;
    hashWritten[bulkPath] = true;
    console.log('HashDataWriter', key,' to', absolutePath);
    if(!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
    }
    const rawStream = fs.createWriteStream(absolutePath)
    // if( !options || !options.gzip ) {
    //     const writeStream = zlib.createGzip().pipe(rawStream);
    // } else {
        const writeStream = rawStream;
    //}
    const isRaw = ArrayBuffer.isView(data);
    const rawData = isRaw ? data : JSON.stringify(data, null, 1);
    await writeStream.write(rawData);
    writeStream.close();
    return bulkPath;
}

/**
 * Returns a hash path relative to the objectUID directory.
 */
HashDataWriter.createHashPath = (data) => {
    const isRaw = ArrayBuffer.isView(data);
    const extension = isRaw ? '.raw' : '.json';
    const hashValue = hash(data);
    return path.join('../../../../bulkdata/',hashValue.substring(0,3),hashValue.substring(3,5),hashValue.substring(5) + extension);
}

module.exports = HashDataWriter;
