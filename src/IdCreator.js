const path = require('path');

function IdCreator({ directoryName, isGroup, isDeduplicate }) {
    return (uids) => {
        const studyPath = path.join(directoryName, 'studies', uids.studyInstanceUid)
        const sopInstanceRootPath = path.join(studyPath, 'series', uids.seriesInstanceUid, 'instances', uids.sopInstanceUid)
        const deduplicatedPath = path.join(studyPath, 'deduplicated');
        const imageFrameRootPath = path.join(sopInstanceRootPath, 'frames')
        return {
            ...uids,
            studyPath,
            deduplicatedPath,
            sopInstanceRootPath,
            imageFrameRootPath,
        }
    };
}

module.exports = IdCreator;