const octetStream = 'application/octet-stream';
const uncompressed = { uncompressed: true, gzip: true, contentType: octetStream };
const jpeg = 'image/jpeg';
const jls = 'image/x-jls';
const jll = 'image/jll';
const jxl = 'image/jxl';
const htj2k = 'image/htj2k';

const uids = {
  '1.2.840.10008.1.2': uncompressed,
  '1.2.840.10008.1.2.1': uncompressed,
  '1.2.840.10008.1.2.4.50': { contentType: jpeg, lossy: true },
  '1.2.840.10008.1.2.4.70': { contentType: jll },
  '1.2.840.10008.1.2.4.140': { contentType: jxl },
  '1.2.840.10008.1.2.4.141': { contentType: jxl, lossy: true },
  // From JPEG original data, lossless to JXL
  '1.2.840.10008.1.2.4.142': { contentType: jxl, lossy: true },
  '1.2.840.10008.1.2.4.150': { contentType: htj2k },
  default: {},
};

module.exports = uids;
