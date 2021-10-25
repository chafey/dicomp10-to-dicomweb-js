const dicomParser = require('dicom-parser')
const asyncIterableToBuffer = require('./asyncIterableToBuffer')
const getVR = require('./getVR')
const getValue = require('./getValue')

const attributeToJS = (metadata, tag, dataSet, attr, callback, options) => {
    const vr = getVR(attr)
    const value = getValue(dataSet, attr, vr, dataSetGen, callback, options)
    metadata[tag.substring(1)] = {
        vr: vr,
        Value: value
    }
}

const dataSetGen = (dataSet, callback, options) => {

    const metadata = {}

    // iterate over dataSet attributes in order
    for(const tag in dataSet.elements) {
        const attr = dataSet.elements[tag]
        attributeToJS(metadata, tag, dataSet, attr, callback, options)
    }

    return {
        metadata: metadata
    }
}

const dicomp10todicomweb = async (dicomp10stream, callback, options) => {

    // Read dicomp10 stream into buffer
    const buffer = await asyncIterableToBuffer(dicomp10stream)

    // Parse it
    const dataSet = dicomParser.parseDicom(buffer)

    // Extract uids
    callback.uids({
        studyInstanceUid : dataSet.string('x0020000d'),
        seriesInstanceUid : dataSet.string('x0020000e'),
        sopInstanceUid : dataSet.string('x00080018')
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
    const result = dataSetGen(dataSet, generator, options)
    callback.metadata(result.metadata)

    // resolve promise with statistics
    return {}
}

module.exports = dicomp10todicomweb