const dicomParser = require('dicom-parser')
const asyncIterableToBuffer = require('./asyncIterableToBuffer')
const getDataSet = require('./getDataSet')

const dicomp10todicomweb = async (dicomp10stream, callback, options) => {
    // Read dicomp10 stream into buffer
    const buffer = await asyncIterableToBuffer(dicomp10stream)

    // Parse it
    const dataSet = dicomParser.parseDicom(buffer)

    // Extract uids
    const id = callback.uids({
        studyInstanceUid : dataSet.string('x0020000d'),
        seriesInstanceUid : dataSet.string('x0020000e'),
        sopInstanceUid : dataSet.string('x00080018'),
        transferSyntaxUid: dataSet.string('x00020010')
    })

    let bulkDataIndex = 0
    let imageFrameIndex = 0
    const generator = {
        bulkdata: (bulkData) => {
            callback.bulkdata(bulkDataIndex++, bulkData)
        },
        imageFrame: (imageFrame) => {
            callback.imageFrame(imageFrameIndex++, imageFrame)
        }
    }

    // convert to DICOMweb MetaData and BulkData
    const result = getDataSet(dataSet, generator, options)
    callback.metadata(result.metadata)

    // resolve promise with statistics
    return {}
}

module.exports = dicomp10todicomweb