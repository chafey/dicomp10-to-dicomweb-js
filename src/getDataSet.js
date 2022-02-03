const getVR = require('./getVR')
const getValue = require('./getValue')
const Tags = require('./Tags')

const attributeToJS = async (metadata, tag, dataSet, attr, callback, options, parentAttr) => {
    const vr = getVR(attr)
    const value = await getValue(dataSet, attr, vr, getDataSet, callback, options, parentAttr)
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

/**
 * Get dataset.
 * 
 * ParentAttr is used to control root/non-root attr scenarios (such as pixel data).
 * 
 * @param {*} dataSet 
 * @param {*} callback 
 * @param {*} options 
 * @param {*} parentAttr Parent reference for sequence element tags.
 * @returns 
 */
const getDataSet = async (dataSet, callback, options, parentAttr = undefined) => {
    const metadata = {}

    // iterate over dataSet attributes in order
    for (const tag in dataSet.elements) {
        // Raw versions have the x in front of them
        if( tag!=Tags.RawTransferSyntaxUID && tag >= Tags.RawMinTag && tag < Tags.RawFirstBodyTag ) {
            continue;
        }
        const attr = dataSet.elements[tag]
        await attributeToJS(metadata, tag, dataSet, attr, callback, options, parentAttr)
    }
    if( metadata[Tags.TransferSyntaxUID] ) {
        // console.log(`Found tsuid ${metadata[Tags.TransferSyntaxUID]} assigning to ${Tags.AvailableTransferSyntaxUID}`)
        metadata[Tags.AvailableTransferSyntaxUID] = metadata[Tags.TransferSyntaxUID];
        delete metadata[Tags.TransferSyntaxUID];
    }
    return { metadata }
}

module.exports = getDataSet