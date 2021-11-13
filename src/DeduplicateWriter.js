const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');
const JSONWriter = require('./JSONWriter');

const writeDeduplicatedFile = async (dir, data) => {
    const hashValue = hash(data);
    console.log('Writing deduplicated instance to', dir, hashValue);
    await JSONWriter(dir,hashValue, data);
    return hashValue;
}

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const DeduplicateWriter = async (id, data) => {
    const { studyInstanceUid, sopInstanceUid } = id;
    if (this.studyInstanceUid != studyInstanceUid) {
        if (this.studyInstanceUid) {
            await writeDeduplicatedFile(this.deduplicatedPath, this.studyData);
        }
        this.studyData = [];
        this.studyInstanceUid = studyInstanceUid;
        this.deduplicatedPath = id.deduplicatedPath;
    }
    this.studyData.push(data);
};

DeduplicateWriter.perInstance = async (id, data) => {
    const { deduplicatedPath } = id;
    const instanceDir = path.join(deduplicatedPath,'instances');
    return writeDeduplicatedFile(instanceDir,data);
};

module.exports = DeduplicateWriter;
