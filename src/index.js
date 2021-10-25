const dicomParser = require('dicom-parser')
const asyncIterableToBuffer = require('./asyncIterableToBuffer')
const getVR = require('./getVR')
const getValue = require('./getValue')

const attributeToJS = (metadata, tag, dataSet, attr, callback, options) => {
    const vr = getVR(attr)
    const value = getValue(dataSet, attr, vr, dataSetGen, callback, options)
    metadata[tag] = {
        vr: vr,
        Value: value
    }
}

const dataSetGen = (dataSet, callback, options) => {

    const metadata = {}

    // iterate over dataSet attributes in order
    console.log(Object.keys(dataSet.elements))
    for(const tag in dataSet.elements) {
        const attr = dataSet.elements[tag]
        attributeToJS(metadata, tag, dataSet, attr, callback, options)
    }

    console.log(metadata)

    return {
        metadata: metadata
    }
}





const dicomp10todicomweb = async (dicomp10stream, callback, options) => {

    // Read dicomp10 stream into buffer
    const buffer = await asyncIterableToBuffer(dicomp10stream)

    // Parse it
    const dataSet = dicomParser.parseDicom(buffer)

    // convert to DICOMweb MetaData and BulkData
    const result = dataSetGen(dataSet, callback, options)
    callback.metadata(result.metadata)

    // TODO: Generate image frames

    // resolve promise with statistics
    return {}
}

module.exports = dicomp10todicomweb