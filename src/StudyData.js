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
    // The list of already existing files read in to create this object
    existingFiles = [];

    // Used to track if new instances have been added.
    newInstancesAdded = 0;

    constructor({ studyInstanceUid, studyPath }, {isGroup, isClean}) {
        this.studyInstanceUid = studyInstanceUid;
        this.studyPath = studyPath;
        this.isGroup = isGroup;
    }

    /**
     * Clean the directory, and/or read existing data in the isInstances or isGroup files.
     * TODO - implement this.
     */
    async init({instancesRoot, deduplicatedRoot, clean}) {
        if( clean ) {
            // Wipe out the study directory entirely, as well as the deduplicatedRoot and instancesRoot
        }
        if( deduplicatedRoot ) {
            await this.readDeduplicated(path.join(deduplicatedRoot,this.studyInstanceUid, 'deduplicated'));
        }
        if( instancesRoot ) {
            await this.readDeduplicated(path.join(instancesRoot,this.studyInstanceUid, 'deduplicated', 'instances'));
        }
    }

    get numberOfInstances() {
        return this.deduplicated.length;
    }

    /**
     * Indicate if this study is 'dirty', that is, has been updated.
     * That is NOT to say that the metadata files generated from this study data are up to date, that is
     * a separate type of check.
     */
    get dirty() {
        return this.newInstancesAdded>0 || this.existingFiles.length>1;
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
        // TODO - check the hash code on the added data, if it has already been seen then ignore this item.
        this.newInstancesAdded++;
        this.deduplicated.push(data);
    }

    /**
     * Reads the deduplicated instance directory, for all instances not already referenced.
     * Only reads .json files.
     * Records the files read in referencedFiles list.
     * Sets the dirty deduplicated flag if any instance was read.
     * 
     * @param {*} deduplicatedInstanceDirectory 
     */
    async readInstances(deduplicatedInstanceDirectory) {

    }

    /**
     * Reads the deduplicated directory, finding the newest file in the directory of type JSON, 
     * and then reads it in.  It then reads in all un-referenced files, and adds references to those to the
     * current path, NOT changing the hash value of the top level element.
     * 
     * Records the files read in referencedFiles list.
     * Sets the dirty deduplicated flag if at least two instances were read.
     * 
     * Does NOT call the readInstances, which is a separate step which can be executed after this one.
     * 
     * @param {*} deduplicatedDirectory 
     */
    async readDeduplicated(deduplicatedDirectory) {

    }
}

module.exports = StudyData;