const Tags = require('./Tags');
const path = require('path');
const fs = require('fs');
const JSONReader = require('./JSONReader');

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
    readHashes = {};

    // Used to track if new instances have been added.
    newInstancesAdded = 0;

    constructor({ studyInstanceUid, studyPath }, { isGroup }) {
        this.studyInstanceUid = studyInstanceUid;
        this.studyPath = studyPath;
        this.isGroup = isGroup;
    }

    /**
     * Clean the directory, and/or read existing data in the isInstances or isGroup files.
     * TODO - implement this.
     */
    async init({ instancesRoot, deduplicatedRoot, clean }) {
        if (clean) {
            // Wipe out the study directory entirely, as well as the deduplicatedRoot and instancesRoot
        }
        if (deduplicatedRoot) {
            await this.readDeduplicated(path.join(deduplicatedRoot, this.studyInstanceUid, 'deduplicated'));
        }
        if (instancesRoot) {
            await this.readDeduplicated(path.join(instancesRoot, this.studyInstanceUid, 'deduplicated', 'instances'));
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
        return this.newInstancesAdded > 0 || this.existingFiles.length > 1;
    }

    async getOrLoadExtract(hashKey) {
        let item = this.extractData[hashKey];
        if (!item) {
            item = await JSONReader.readHashData(this.studyPath, hashKey)
            if (!item) {
                console.error('Unable to read hashdata', hashKey);
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
        if (index < 0 || index >= this.deduplicated.length) {
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

    async addExtracted(callback, hashKey, item) {
        if (this.extractData[hashKey]) return;
        await callback.bulkdata(this, hashKey, item);
        this.extractData[hashKey] = item;
    }

    addDeduplicated(data) {
        if (!this.isGroup) return;
        // TODO - check the hash code on the added data, if it has already been seen then ignore this item.
        this.newInstancesAdded++;
        this.deduplicated.push(data);
    }

    async listJsonFiles(dir) {
        const names = await fs.promises.readdir(dir);
        if (!names || names.length == 0) return [];
        const gzNames = names.filter(name => name.indexOf('.gz') > 0);
        const statInfo = gzNames.map(name => {
            const stat = fs.statSync(path.join(dir, name));
            return {
                ...stat,
                name,
                hash: name.substring(0, name.indexOf('.')),
            };
        }).sort((a, b) => a.mtimeMs - b.mtimeMs);
        return statInfo;
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
        try {
            const files = await this.listJsonFiles(deduplicatedDirectory);
            if (!files || !files.length) {
                console.log('No deduplicated for', deduplicatedDirectory);
                return;
            }
            console.log('There are', files.length,'files to check');
            for (let i = 0; i < files.length; i++) {
                const stat = files[i];
                const { hash } = stat;
                console.log('Checking for', stat.name, hash);
                if (this.readHashes[hash]) continue;
                await this.readDeduplicatedFile(deduplicatedDirectory, stat);
            }
        } catch (e) {
            // No-op console.log(e);
        }
    }

    async readDeduplicatedFile(dir, stat) {
        const { hash, name } = stat;
        try {
            console.log('Reading deduplicated file', name);
            const data = await JSONReader(dir, name);
            this.readHashes[hash] = data;
            this.existingFiles.push(name);
            data.forEach(item => {
                const itemHash = item[Tags.DeduppedHash];
                const typeEl = item[Tags.DeduppedType];
                const type = typeEl && typeEl.Value[0];
                if (type == Tags.InstanceType) {
                    console.log('Adding item');
                    this.deduplicated.push(item);
                } else if (type == 'info') {
                    console.log('File info:', item);
                } else {
                    console.log('Unknown type:', type);
                }
            });
        } catch (e) {
            console.error('Unable to read', dir, name);
        }
    }
}

module.exports = StudyData;