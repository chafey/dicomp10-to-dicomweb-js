const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** The deduplicated reader will take an id, consisting of:
 * deduplicatedStudyDir is the deduplicated study directory
 * deduplicatedInstanceDir is the instance level deduplicated file directory
 * StudyInstanceUID is the study instance UID
 */
const DeduplicatedReader = async (dir, name, def) => {
    let finalData;
    try {
        let rawdata = fs.readFileSync(path.join(dir, name));
        if (name.indexOf('.gz') != -1) {
            finalData = zlib.gunzipSync(rawdata).toString('utf-8');
        } else {
            finalData = rawdata;
        }
    } catch (err) {
        console.log('Couldn\'t read', dir, name);
    }
    return finalData && JSON.parse(finalData) || def;
};

/** Calls the JSON reader on the path appropriate for the given hash data */
JSONReader.readHashData = (studyDir, hashValue, extension='.json.gz') => {
    const hashPath = path.join(studyDir,'bulkdata',hashValue.substring(0,3),hashValue.substring(3,5));
    return JSONReader(hashPath,hashValue.substring(5) + extension);
}

module.exports = JSONReader;