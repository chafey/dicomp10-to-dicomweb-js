const zlib = require('zlib');
const hash = require('object-hash');
const fs = require('fs')
const path = require('path');
const JSONWriter = require('./JSONWriter');

const writeDeduplicatedFile = async (dir, data) => {
    const hashValue = hash(data);
    console.log('Writing deduplicated instance to', dir, hashValue);
    await JSONWriter(dir, hashValue, data);
    return hashValue;
}


const perInstanceWriter = async (id, data) => {
    const { deduplicatedPath } = id;
    const instanceDir = path.join(deduplicatedPath, 'instances');
    return await writeDeduplicatedFile(instanceDir, data);
};

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const DeduplicateWriter = options =>
    async function (id, data) {
        const studyData = await this.completeStudy.getCurrentStudyData(this,id);
        
        if( options.isDeduplicate ) {
            await perInstanceWriter(id,data);
        }
        studyData.addDeduplicated(data);
    };

module.exports = DeduplicateWriter;
