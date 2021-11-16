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
    listeners = [];

    constructor({studyInstanceUid,studyPath}) {
        this.studyInstanceUid = studyInstanceUid;
        this.studyPath = studyPath;
    }

    loadFromDeduplicatedGroup() {

    }

    loadFromDeduplicatedInstances() {

    }
}