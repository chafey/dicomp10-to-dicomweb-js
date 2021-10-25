const getVR = require('./getVR')

const getValueInlineString = (dataSet, attr) => {
    return dataSet.string(attr.tag)
}

const getValueInlineBinary = (dataSet, attr) => {
    const binaryValue = dataSet.byteArray.slice(attr.dataOffset, attr.dataOffset + attr.length)
    return binaryValue.toString('base64')
}

const getValueInlineSignedShort = (dataSet, attr) => {
    if(attr.length > 2) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.int16(attr.tag)
    }
}

const getValueInlineUnsignedShort = (dataSet, attr) => {
    if(attr.length > 2) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.uint16(attr.tag)
    }
}

const getValueInlineSignedLong = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.int32(attr.tag)
    }
}

const getValueInlineUnsignedLong = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.uint32(attr.tag)
    }
}

const getValueInlineFloat = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.float(attr.tag)
    }
}
const getValueInlineFloatDouble = (dataSet, attr) => {
    if(attr.length > 8) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return dataSet.double(attr.tag)
    }
}

/*
const attrDataRefToIon = (dataSet, attr) => {
    const data = new Uint8Array(dataSet.byteArray.buffer, attr.dataOffset, attr.length)
    const digest = getHash(data)
    const result = {
        dataOffset: attr.dataOffset,
        length: attr.length,
        sha256: digest
    }
    return result
}*/

const getValueInlineAttributeTag = (dataSet, attr) => {
    const group = dataSet.uint16(attr.tag, 0)
    const groupHexStr = ("0000" + group.toString(16)).substr(-4)
    const element = dataSet.uint16(attr.tag, 1)
    const elementHexStr = ("0000" + element.toString(16)).substr(-4)
    return groupHexStr + elementHexStr
}

const getValueInline = (dataSet, attr, vr) => {
    if(attr.length == 0) {
        return []
    }
    
    switch(vr) {
        case 'AE': 
        case 'AS': 
            return getValueInlineString(dataSet, attr)
        case 'AT': 
            return getValueInlineAttributeTag(dataSet, attr)
        case 'CS': 
        case 'DA': 
        case 'DS': 
        case 'DT': 
            return getValueInlineString(dataSet, attr)
        case 'FL':
            return getValueInlineFloat(dataSet, attr)
        case 'FD':
            return getValueInlineFloatDouble(dataSet, attr)
        case 'IS': 
        case 'LO': 
        case 'LT': 
            return getValueInlineString(dataSet, attr)
        case 'OB':
        case 'OF':
        case 'OW':
            return getValueInlineBinary(dataSet, attr)
        case 'PN': 
        case 'SH': 
            return getValueInlineString(dataSet, attr)
        case 'SL':
            return getValueInlineSignedLong(dataSet, attr)
        case 'SS':
            return getValueInlineSignedShort(dataSet, attr)
        case 'ST': 
        case 'TM': 
        case 'UI': 
            return getValueInlineString(dataSet, attr)
        case 'UL':
            return getValueInlineUnsignedLong(dataSet, attr)
        case 'UN':
            return getValueInlineBinary(dataSet, attr)
        case 'US':
            return getValueInlineUnsignedShort(dataSet, attr)
        case 'UT': 
            return getValueInlineString(dataSet, attr)
        default:
            return getValueInlineBinary(dataSet, attr)
    }
}

/*
const getValuePixelData = (dataSet, attr) => {
    const result = attrDataRefToIon(dataSet, attr)
    if(attr.encapsulatedPixelData) {
        result.encapsulatedPixelData = attr.encapsulatedPixelData
    }
    if(attr.basicOffsetTable) {
        result.basicOffsetTable = attr.basicOffsetTable
    }
    if(attr.fragments) {
        result.fragments = attr.fragments
    }
    return result
}
*/

const getValue = (dataSet, attr, vr, dataSetGen, callback, options) => {
    if(attr.tag === 'x7fe00010') {
        return null
        //return getValuePixelData(dataSet, attr, callbaclk)
    }
    if(attr.items) {
        // sequences
        return attr.items.map((item) => {
            return dataSetGen(item.dataSet, options)
        })
    } else {
        // non sequence item
        if(attr.length <= options.maximumInlineDataLength) {
            return getValueInline(dataSet, attr, vr)
        } else {
            //return attrBulkData(dataSet, attr)
        }
    }
}
module.exports = getValue