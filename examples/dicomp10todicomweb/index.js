const dicomp10todicomweb = require('../../src')
const fs = require('fs')
const path = require('path');

const main = async () => {
    if(process.argv.length < 4) {
        console.log('dicomp10todicomweb <inputfile> <outputdirectory>')
        return
    }
    const dicomp10stream = fs.createReadStream(process.argv[2])
    const options = {
        maximumInlineDataLength: 128
    }

    let sopInstanceRootPath
    let imageFrameRootPath
    let bulkDataRootPath

    const callback = {
        uids: (uids) => {
            sopInstanceRootPath = path.join(process.argv[3], uids.studyInstanceUid, 'series', uids.seriesInstanceUid, 'instances', uids.sopInstanceUid)
            fs.mkdirSync(sopInstanceRootPath, { recursive: true })
            imageFrameRootPath = path.join(sopInstanceRootPath, 'frames')
            bulkDataRootPath = path.join(sopInstanceRootPath, 'bulkdata')
        },
        metadata: (metadata) => {
            const sopMetaDataPath = path.join(sopInstanceRootPath, 'metadata')
            fs.writeFileSync(sopMetaDataPath, JSON.stringify(metadata, null, 2) , 'utf-8')
        },
        bulkdata: (index, bulkData) => {
            if(!fs.existsSync(bulkDataRootPath)) {
                fs.mkdirSync(bulkDataRootPath, { recursive: true })
            }
            const bulkDataPath = path.join(bulkDataRootPath, '' + index)
            fs.writeFileSync(bulkDataPath, bulkData)
        },
        imageFrame: (index, imageFrame) => {
            if(!fs.existsSync(imageFrameRootPath)) {
                fs.mkdirSync(imageFrameRootPath, { recursive: true })
            }
            const imageFramePath = path.join(imageFrameRootPath, '' + index)
            fs.writeFileSync(imageFramePath, imageFrame)
        }
    }

    await dicomp10todicomweb(dicomp10stream, callback, options)
}

main()
.then(()=> {
    console.log('done')
})