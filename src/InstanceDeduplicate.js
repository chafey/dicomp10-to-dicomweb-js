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
    const seriesUID = imageFrame[Tags.SeriesInstanceUID];
    const sopUID = imageFrame[Tags.SOPInstanceUID];
    if( !sopUID ) {
        console.warn("No sop instance UID in", imageFrame);
        return;
    }
    if( studyData.sopExists(sopUID) ) {
        // console.log('SOP Instance UID', sopUID.Value[0], 'already exists, skipping');
        // TODO - allow replace as an option
        return;
    }
    const deduplicated = { ...imageFrame };
    
    if (!this.extractors) this.extractors = extractors;
    for (const key of Object.keys(this.extractors)) {
        const extracted = TagLists.extract(deduplicated, key, this.extractors[key], TagLists.RemoveExtract);
        const hashKey = extracted[Tags.DeduppedHash].Value[0];
        await studyData.addExtracted(this, hashKey, extracted)
    }

    // Restore the series and SOP UIDs
    deduplicated[Tags.SeriesInstanceUID] = seriesUID;
    deduplicated[Tags.SOPInstanceUID] = sopUID;
    TagLists.addHash(deduplicated,Tags.InstanceType);
    
    return deduplicated;
}

const InstanceDeduplicate = options =>
    async function InstanceDeduplicate(id, imageFrame) {
        // Notify the existing listeners, if any
        if (options.isInstanceMetadata) {
            await JSONWriter(id.sopInstanceRootPath, 'metadata', imageFrame);
        }
        if( !options.isDeduplicate && !options.isGroup ) {
            return;
        }
        if (!this.deduplicateSingleInstance) this.deduplicateSingleInstance = deduplicateSingleInstance;
        const deduppedInstance = await this.deduplicateSingleInstance(id, imageFrame);
        if( !deduppedInstance ) return;
        await this.deduplicated(id, deduppedInstance);
    }

module.exports = InstanceDeduplicate;