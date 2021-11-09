const extractImageFrames = require('./extractImageFrames')

const getValueInlineString = (dataSet, attr) => {
    return [dataSet.string(attr.tag)]
}

const getValuePatientName = (dataSet, attr) => {
    return [{Alphabetic: dataSet.string(attr.tag)}]
}

const getValueInlineBinary = (dataSet, attr) => {
    const binaryValue = dataSet.byteArray.slice(attr.dataOffset, attr.dataOffset + attr.length)
    return binaryValue.toString('base64')
}

const getValueInlineSignedShort = (dataSet, attr) => {
    if(attr.length > 2) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.int16(attr.tag)]
    }
}

const getValueInlineUnsignedShort = (dataSet, attr) => {
    if(attr.length > 2) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.uint16(attr.tag)]
    }
}

const getValueInlineSignedLong = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.int32(attr.tag)]
    }
}

const getValueInlineUnsignedLong = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.uint32(attr.tag)]
    }
}

const getValueInlineFloat = (dataSet, attr) => {
    if(attr.length > 4) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.float(attr.tag)]
    }
}

const getValueInlineIntString = (dataSet, attr) => {
    return getValueInlineString(dataSet,attr).map(val => parseInt(val));
}

const getValueInlineFloatDouble = (dataSet, attr) => {
    if(attr.length > 8) {
        return getValueInlineBinary(dataSet, attr)
    } else {
        return [dataSet.double(attr.tag)]
    }
}

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
            return getValueInlineIntString(dataSet,attr);
        case 'LO': 
        case 'LT': 
            return getValueInlineString(dataSet, attr)
        case 'OB':
        case 'OF':
        case 'OW':
            return getValueInlineBinary(dataSet, attr)
        case 'PN': 
            return getValuePatientName(dataSet, attr);
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

const getValue = (dataSet, attr, vr, getDataSet, callback, options) => {
    if(attr.tag === 'x7fe00010') {
        extractImageFrames(dataSet, attr, vr, callback, options)
        return
    }
    if(attr.items) {
        // sequences
        return attr.items.map((item) => {
            const result = getDataSet(item.dataSet, callback, options)
            return result.metadata
        })
    } else {
        // non sequence item
        if(attr.length <= options.maximumInlineDataLength) {
            return getValueInline(dataSet, attr, vr)
        } else {
            const binaryValue = dataSet.byteArray.slice(attr.dataOffset, attr.dataOffset + attr.length)
            callback.bulkdata(binaryValue)
            // TODO: add bulkdata ref to metadata
        }
    }
}
module.exports = getValue