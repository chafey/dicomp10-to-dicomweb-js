const zlib = require('zlib');
const hashFactory = require('node-object-hash');
const hasher = hashFactory();
const fs = require('fs')
const path = require('path');
const JSONWriter = require('./JSONWriter');
const Tags = require('./Tags');
const TagLists = require('./TagLists');

const writeDeduplicatedFile = async (dir, data, hashValue) => {
    if( !hashValue ) hashValue = hasher.hash(data);
    console.log('Writing deduplicated instance to', dir, hashValue);
    await JSONWriter(dir, hashValue, data);
    return hashValue;
}


const perInstanceWriter = async (id, data) => {
    const { deduplicatedInstancesPath } = id;
    const hashValue = TagLists.addHash(data,Tags.InstanceType);
    return await writeDeduplicatedFile(deduplicatedInstancesPath, [data], hashValue);
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
