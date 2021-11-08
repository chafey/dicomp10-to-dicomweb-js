const TagLists = require('./TagLists');
const Tags = require('./Tags');

/**
 * This is an instance listener - the way this one works is that it listens for instance metadata.
 * Every time an instance metadata event is fired, it deduplicates a bunch of data, firing deduplicate events,
 * and then collects the deduplicate data into a list.
 * Whenever the study UID changes, a new event is fired to indicate the deduplicated data is ready.
 */
class InstanceDeduplicate {
    constructor(existingListeners) {
        this.previousMetadata = existingListeners.metadata;
        this.listeners = existingListeners;
    }

    bindMetadata() {
        return this.metadata.bind(this);
    }

    /** Writes out the study deduplicated data */
    finalizeStudy() {
        console.log('Finalizing study with', this.deduplicated.length, 'instances');
        this.studyUID = null;
        this.deduplicated = null;
        this.extractData = null;
    }

    extractors = { patient: TagLists.PatientQuery, study: TagLists.StudyQuery, series: TagLists.SeriesQuery};

    async deduplicateInstance(id, imageFrame) {
        const deduplicated = Object.assign({}, imageFrame);
        const options = {remove:true,hash:true};
        
        for(const key of Object.keys(this.extractors) ) {
            const extracted = TagLists.extract(deduplicated, this.extractors[key], options);
            this.listeners.bulkdata(id,key, extracted);
        }
        return deduplicated;
    }

    async metadata(id, imageFrame) {
        // Notify the existing listeners, if any
        if( this.existingListeners ) await existingListeners(id,index,imageFrame);
        const {studyInstanceUID } = id;
        if( this.studyUID && !studyInstanceUID==this.studyUID ) {
            this.finalizeStudy();
        }
        if( !this.studyUID ) {
            this.deduplicated = [];
            this.extractData = {};
            this.studyUID = studyInstanceUID;
        }
        const deduppedInstance = await this.deduplicateInstance(id,imageFrame);
        const { deduplicated } = this.listeners;
        deduplicated(id,deduppedInstance);
    }
}

module.exports = InstanceDeduplicate;