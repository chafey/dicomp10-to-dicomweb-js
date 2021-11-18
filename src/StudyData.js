const Tags = require('./Tags');

/**
 * StudyData contains information about the grouped study data.  It is used to create
 * study level information such as study or series level metadata, and to group things
 * together during processing, such as handling the study level deduplicated group
 * files.  
 * 
 * It also has methods on performing study level operations such as patient name updates
 * or instance remove operations, and has methods to handle avoiding needing to store instance
 * level data multiple times when it already exists.
 */
class StudyData {
    deduplicated = [];
    extractData = {};

    constructor({ studyInstanceUid, studyPath }, {isGroup, isClean}) {
        this.studyInstanceUid = studyInstanceUid;
        this.studyPath = studyPath;
        this.isGroup = isGroup;
    }

    /**
     * Clean the directory, and/or read existing data in the isInstances or isGroup files.
     * TODO - implement this.
     */
    async init() {

    }

    get numberOfInstances() {
        return this.deduplicated.length;
    }

    async getOrLoadExtract(hashKey) {
        let item = this.extractData[hashKey];
        if (!item) {
            item = await JSONReader.readHashData(this.studyPath, hashKey)
            if (!item) {
                return item
            }
            this.extratData[hashKey] = item
        }
        return item
    }

    /** 
     * Create a full study instance data for instance at index
     */
    async recombine(index) {
        const deduplicated = this.deduplicated[index];
        if(index<0 || index>=this.deduplicated.length) {
            throw new Error(`Can't read index ${index}, out of bounds [0..${this.deduplicated.length})`)
        }
        const refs = deduplicated[Tags.DeduppedRef];
        if (!refs) {
            console.log('No refs for', deduplicated);
            return deduplicated;
        }
        const ret = Object.assign({}, deduplicated);
        for (const hashKey of refs.Value) {
            const item = await this.getOrLoadExtract(hashKey);
            Object.assign(ret, item);
        }
        return ret;
    }

    async addExtracted(callback,hashKey,item) {
        if( this.extractData[hashKey] ) return;
        await callback.bulkdata(this, hashKey, item);
        this.extractData[hashKey] = item;
    }

    addDeduplicated(data) {
        if( !this.isGroup ) return;
        this.deduplicated.push(data);
    }
}

module.exports = StudyData;