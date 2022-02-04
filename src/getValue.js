const extractImageFrames = require('./extractImageFrames');

const getValueInlineString = (dataSet, attr) => [dataSet.string(attr.tag)];

const getStrings = (dataSet, attr) => {
  const ret = dataSet.string(attr.tag);
  return ret && ret.split(/\\/) || undefined;
};

const getValuePatientName = (dataSet, attr) => {
  const strings = getStrings(dataSet, attr);
  return strings && strings.map((item) => ({ Alphabetic: item })) || undefined;
};

/** Gets either InlineBinary or BulkDataURI, if already defined */
const getValueInlineBinary = (dataSet, attr) => {
  if (attr.BulkDataURI) return { BulkDataURI: attr.BulkDataURI };
  const binaryValue = dataSet.byteArray.slice(attr.dataOffset, attr.dataOffset + attr.length);
  return { InlineBinary: binaryValue.toString('base64') };
};

const getValueInlineSignedShort = (dataSet, attr) => {
  if (attr.length > 2) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.int16(attr.tag)];
};

const getValueInlineUnsignedShort = (dataSet, attr) => {
  if (attr.length > 2) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.uint16(attr.tag)];
};

const getValueInlineSignedLong = (dataSet, attr) => {
  if (attr.length > 4) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.int32(attr.tag)];
};

const getValueInlineUnsignedLong = (dataSet, attr) => {
  if (attr.length > 4) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.uint32(attr.tag)];
};

const getValueInlineFloat = (dataSet, attr) => {
  if (attr.length > 4) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.float(attr.tag)];
};

const getValueInlineIntString = (dataSet, attr) => getStrings(dataSet, attr).map((val) => parseInt(val));

const getValueInlineFloatString = (dataSet, attr) => getStrings(dataSet, attr).map((val) => parseFloat(val));

const getValueInlineFloatDouble = (dataSet, attr) => {
  if (attr.length > 8) {
    return getValueInlineBinary(dataSet, attr);
  }
  return [dataSet.double(attr.tag)];
};

const getValueInlineAttributeTag = (dataSet, attr) => {
  const group = dataSet.uint16(attr.tag, 0);
  const groupHexStr = (`0000${group.toString(16)}`).substr(-4);
  const element = dataSet.uint16(attr.tag, 1);
  const elementHexStr = (`0000${element.toString(16)}`).substr(-4);
  return groupHexStr + elementHexStr;
};

const getValueInline = (dataSet, attr, vr) => {
  if (attr.length == 0) {
    return [];
  }

  switch (vr) {
    case 'AE':
    case 'AS':
      return getValueInlineString(dataSet, attr);
    case 'AT':
      return getValueInlineAttributeTag(dataSet, attr);
    case 'DS':
      return getValueInlineFloatString(dataSet, attr);
    case 'CS':
    case 'DA':
    case 'DT':
      return getValueInlineString(dataSet, attr);
    case 'FL':
      return getValueInlineFloat(dataSet, attr);
    case 'FD':
      return getValueInlineFloatDouble(dataSet, attr);
    case 'IS':
      return getValueInlineIntString(dataSet, attr);
    case 'LO':
    case 'LT':
      return getValueInlineString(dataSet, attr);
    case 'OB':
    case 'OF':
    case 'OW':
      return getValueInlineBinary(dataSet, attr);
    case 'PN':
      return getValuePatientName(dataSet, attr);
    case 'SH':
      return getValueInlineString(dataSet, attr);
    case 'SL':
      return getValueInlineSignedLong(dataSet, attr);
    case 'SS':
      return getValueInlineSignedShort(dataSet, attr);
    case 'ST':
    case 'TM':
    case 'UI':
      return getValueInlineString(dataSet, attr);
    case 'UL':
      return getValueInlineUnsignedLong(dataSet, attr);
    case 'UN':
      return getValueInlineBinary(dataSet, attr);
    case 'US':
      return getValueInlineUnsignedShort(dataSet, attr);
    case 'UT':
      return getValueInlineString(dataSet, attr);
    default:
      return getValueInlineBinary(dataSet, attr);
  }
};

const isPrivate = (attr) => {
  const { tag } = attr;
  const ch = tag.substr(4, 1);
  const chHex = parseInt(ch, 16);
  return chHex % 2 == 1;
};

const isValueInline = (attr, options) => {
  if (isPrivate(attr)) {
    return attr.length <= options.maximumInlinePrivateLength;
  }
  return attr.length <= options.maximumInlinePublicLength;
};

const getValue = async (dataSet, attr, vr, getDataSet, callback, options) => {
  if (attr.tag === 'x7fe00010') {
    const BulkDataURI = await extractImageFrames(dataSet, attr, vr, callback, options);
    return { BulkDataURI };
  }
  if (attr.items) {
    // sequences
    const result = [];
    for (const item of attr.items) {
      const subResult = await getDataSet(item.dataSet, callback, options);
      if (subResult.metadata) result.push(subResult.metadata);
    }
    return result;
  }
  // non sequence item
  if (isValueInline(attr, options)) {
    return getValueInline(dataSet, attr, vr);
  }
  const binaryValue = dataSet.byteArray.slice(attr.dataOffset, attr.dataOffset + attr.length);
  const BulkDataURI = await callback.bulkdata(binaryValue);
  return { BulkDataURI };
};
module.exports = getValue;
