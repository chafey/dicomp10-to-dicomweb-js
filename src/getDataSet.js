const getVR = require('./getVR')
const getValue = require('./getValue')

const attributeToJS = (metadata, tag, dataSet, attr, callback, options) => {
    const vr = getVR(attr)
    const value = getValue(dataSet, attr, vr, getDataSet, callback, options)
    metadata[tag.substring(1).toUpperCase()] = {
        vr: vr,
        Value: value
    }
}

const getDataSet = (dataSet, callback, options) => {
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

module.exports = getDataSet