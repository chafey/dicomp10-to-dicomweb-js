const dicomParser = require('dicom-parser')
const asyncIterableToBuffer = require('./asyncIterableToBuffer')
const getDataSet = require('./getDataSet')
const JSONWriter = require('./JSONWriter')
const InstanceDeduplicate = require('./InstanceDeduplicate')
const DeduplicateWriter = require('./DeduplicateWriter')
const HashDataWriter = require('./HashDataWriter')

const dicomp10todicomweb = async (dicomp10stream, callback, options) => {
    // Read dicomp10 stream into buffer
    const buffer = await asyncIterableToBuffer(dicomp10stream)

    // Parse it
    const dataSet = dicomParser.parseDicom(buffer)
    
    // TODO - make this a streaming parse
    // const dataSet = dicomParser.parseDicom(dicomp10stream)

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
        bulkdata: (bulkData) =>
            callback.bulkdata(id, bulkDataIndex++, bulkData),
        imageFrame: (imageFrame) =>
            callback.imageFrame(id, imageFrameIndex++, imageFrame)
    }

    // convert to DICOMweb MetaData and BulkData
    const result = getDataSet(dataSet, generator, options)
    await callback.metadata(id, result.metadata)

    // resolve promise with statistics
    return {}
}

// Add help applications
dicomp10todicomweb.JSONWriter = JSONWriter;
dicomp10todicomweb.HashDataWriter = HashDataWriter;
dicomp10todicomweb.DeduplicateWriter = DeduplicateWriter;
dicomp10todicomweb.InstanceDeduplicate = InstanceDeduplicate;

module.exports = dicomp10todicomweb