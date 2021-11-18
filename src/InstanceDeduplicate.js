const JSONWriter = require('./JSONWriter');
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
    const studyData = await this.completeStudy.getCurrentStudyData(this, id);
    const deduplicated = { ...imageFrame };
    const options = { remove: true, hash: true };

    if (!this.extractors) this.extractors = extractors;
    for (const key of Object.keys(this.extractors)) {
        const extracted = TagLists.extract(deduplicated, key, this.extractors[key], options);
        const hashKey = extracted[Tags.DeduppedHash].Value[0];
        await studyData.addExtracted(this, hashKey, extracted)
    }
    return deduplicated;
}

const InstanceDeduplicate = options =>
    async function InstanceDeduplicate(id, imageFrame) {
        // Notify the existing listeners, if any
        if (options.isInstanceMetadata) {
            await JSONWriter(id.sopInstanceRootPath, 'metadata', imageFrame);
        }
        if( !options.isDeduplicate && !options.isGroup ) {
            console.log('No deduplicate being generated', options);
            return;
        }
        if (!this.deduplicateSingleInstance) this.deduplicateSingleInstance = deduplicateSingleInstance;
        const deduppedInstance = await this.deduplicateSingleInstance(id, imageFrame);
        await this.deduplicated(id, deduppedInstance);
    }

module.exports = InstanceDeduplicate;