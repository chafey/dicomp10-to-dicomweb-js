const getVR = require('./getVR')
const getValue = require('./getValue')

const attributeToJS = (metadata, tag, dataSet, attr, callback, options) => {
    const vr = getVR(attr)
    const value = getValue(dataSet, attr, vr, getDataSet, callback, options)
    const key = tag.substring(1).toUpperCase();
    if (value == undefined || value.length == 0) {
        metadata[key] = {
            vr: vr,
        }
    } else if( value.InlineBinary || value.BulkDataURI ) {
        metadata[key] = {
            vr: vr,
            ...value,
        }
    } else {
        metadata[key] = {
            vr: vr,
            Value: value
        }
    }
}

const getDataSet = (dataSet, callback, options) => {
    const metadata = {}

    // iterate over dataSet attributes in order
    for (const tag in dataSet.elements) {
        const attr = dataSet.elements[tag]
        attributeToJS(metadata, tag, dataSet, attr, callback, options)
    }
    return { metadata }
}

module.exports = getDataSet