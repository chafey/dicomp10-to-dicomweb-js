const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');
const Tags = require('./Tags');
const WriteStream = require('./WriteStream');

let hashWritten = {};

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const HashDataWriter = async (id, key, data) => {
    const isRaw = ArrayBuffer.isView(data);
    const {dirName, fileName} = HashDataWriter.createHashPath(data);
    const absolutePath = path.join(id.sopInstanceRootPath, dirName);
    if (hashWritten[absolutePath]) return;
    const rawData = isRaw ? data : JSON.stringify(data, null, 1);
    const writeStream = WriteStream(dirName, fileName, {mkdir:true})
    await writeStream.write(rawData);
    await writeStream.close();
    // console.log('HashDataWriter', key, ' to', absolutePath);
    return dirName + '/'+fileName;
}

/**
 * Returns a hash path relative to the objectUID directory.
 */
HashDataWriter.createHashPath = (data) => {
    const isRaw = ArrayBuffer.isView(data);
    const gzip = !isRaw || data.length > 1024;
    const extension = (isRaw ? '.raw' : '.json') + (gzip && '.gz');
    const existingHash = data[Tags.DeduppedHash];
    const hashValue = existingHash && existingHash.Value[0] || hash(data);
    return { 
        dirName: path.join('../../../../bulkdata/', hashValue.substring(0, 3), hashValue.substring(3, 5)),
        fileName: hashValue.substring(5) + extension,
    };
}


module.exports = HashDataWriter;
