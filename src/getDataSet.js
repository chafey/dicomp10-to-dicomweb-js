const getVR = require('./getVR')
const getValue = require('./getValue')
const Tags = require('./Tags')

const attributeToJS = async (metadata, tag, dataSet, attr, callback, options) => {
    const vr = getVR(attr)
    const value = await getValue(dataSet, attr, vr, getDataSet, callback, options)
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

const getDataSet = async (dataSet, callback, options) => {
    const metadata = {}

    // iterate over dataSet attributes in order
    for (const tag in dataSet.elements) {
        if( tag!=Tags.RawTransferSyntaxUID && tag >= Tags.RawMinTag && tag < Tags.RawFirstBodyTag ) {
            continue;
        }
        const attr = dataSet.elements[tag]
        await attributeToJS(metadata, tag, dataSet, attr, callback, options)
    }
    if( metadata[Tags.TransferSyntaxUID] ) {
        metadata[Tags.AvailableTransferSyntaxUID] = metadata[Tags.TransferSyntaxUID];
        delete metadata[Tags.TransferSyntaxUID];
    }
    return { metadata }
}

module.exports = getDataSet