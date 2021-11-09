const octetStream = 'application/octet-stream';
const uncompressed = {uncompressed:true, gzip: true, contentType: octetStream};
const jpeg = 'image/jpeg';
const jls = 'image/x-jls';
const jll = 'image/jpeg';

const uids = {
    '1.2.840.10008.1.2': uncompressed,
    '1.2.840.10008.1.2.1': uncompressed,
    '1.2.840.10008.1.2.4.50': {contentType: jpeg, lossy:true},
    '1.2.840.10008.1.2.4.70': {contentType: jll},
    default: {},
};

module.exports = uids;