const fs = require('fs')
const path = require('path');

function IdCreator({directoryName}) {
    return (uids) => {
        const studyPath = path.join(directoryName, 'studies', uids.studyInstanceUid)
        const sopInstanceRootPath = path.join(studyPath, 'series', uids.seriesInstanceUid, 'instances', uids.sopInstanceUid)
        const deduplicatedPath = path.join(studyPath, 'deduplicated');
        fs.mkdirSync(sopInstanceRootPath, { recursive: true })
        fs.mkdirSync(path.join(deduplicatedPath,'instances'), { recursive: true })
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