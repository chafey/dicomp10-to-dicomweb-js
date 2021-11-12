const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');

const writeDeduplicatedFile = async (dir, data) => {
    const hashValue = hash(data);
    const dedupFile = path.join(dir, hashValue + '.json');
    console.log('DeduplicateWriter with', data.length, 'instances to', dedupFile);
    const writeStream = fs.createWriteStream(dedupFile)
    const rawData = JSON.stringify(data);
    await writeStream.write(rawData);
    writeStream.close();
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

module.exports = DeduplicateWriter;
