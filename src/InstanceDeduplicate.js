const TagLists = require('./TagLists');
const Tags = require('./Tags');

const extractors = { patient: TagLists.PatientQuery, study: TagLists.StudyQuery, series: TagLists.SeriesExtract };

/**
 * This is an instance listener - the way this one works is that it listens for instance metadata.
 * Every time an instance metadata event is fired, it deduplicates a bunch of data, firing deduplicate events,
 * and then collects the deduplicate data into a list.
 * Whenever the study UID changes, a new event is fired to indicate the deduplicated data is ready.
 */
async function deduplicateSingleInstance(id, imageFrame) {
    if (!imageFrame) return;
    const deduplicated = {...imageFrame};
    const options = { remove: false, hash: true };

    if( !this.extractors ) this.extractors = extractors;
    for (const key of Object.keys(this.extractors)) {
        const extracted = TagLists.extract(deduplicated, key, this.extractors[key], options);
        const hashKey = extracted[Tags.DeduppedHash].Value[0];
        this.bulkdata(id, key, extracted);
        this.extractData[hashKey] = extracted;
    }
    console.log('Pushing instance', id.studyInstanceUid);
    this.deduplicatedInstances.push(deduplicated);
    return deduplicated;
}

async function InstanceDeduplicate(id, imageFrame) {
    // Notify the existing listeners, if any
    const { studyInstanceUid } = id;
    if (this.instanceMetadata) await this.instanceMetadata(id, index, imageFrame);
    if (this.studyInstanceUid && studyInstanceUid !== this.studyInstanceUid) {
        await this.completeStudy();
    }
    if (!this.studyInstanceUid) {
        this.deduplicatedInstances = [];
        this.extractData = {};
        this.id = id;
        this.studyInstanceUid = studyInstanceUid;
    }
    if (!this.deduplicateSingleInstance) this.deduplicateSingleInstance = deduplicateSingleInstance;
    const deduppedInstance = await this.deduplicateSingleInstance(id, imageFrame);
    await this.deduplicated(id, deduppedInstance);
}

module.exports = InstanceDeduplicate;