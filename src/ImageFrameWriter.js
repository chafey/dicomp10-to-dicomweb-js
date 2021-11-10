const fs = require('fs')
const path = require('path');
const uids = require('./uids');
const zlib = require('zlib');

const ImageFrameWriter = async (id, index, imageFrame) => {
    if(!fs.existsSync(id.imageFrameRootPath)) {
        fs.mkdirSync(id.imageFrameRootPath, { recursive: true })
    }
    const {transferSyntaxUid} = id;
    const type = uids[transferSyntaxUid] || uids.default;
    const contentType = `Content-Type: ${type.contentType};transfer-syntax=${transferSyntaxUid}\r\n`
    const fileName = path.join(id.imageFrameRootPath, '' + (1+index))
    let writeStream;
    if( type.gzip ) {
        console.log('Writing gzip stream to', fileName, contentType);
        const rawStream = fs.createWriteStream(fileName+'.gz');
        writeStream = zlib.createGzip();
        writeStream.on('error', err => console.warn('Error:',err));
        writeStream.pipe(rawStream);
    } else {
        console.log('Writing raw output stream to', fileName, contentType);
        writeStream = fs.createWriteStream(fileName);
    }
    await writeStream.write('--BOUNDARY_FIXED_32934857949532587\r\n');
    await writeStream.write(contentType);
    // await writeStream.write(`Content-Length: ${imageFrame.length}\r\n\r\n`);
    await writeStream.write('\r\n');
    await writeStream.write(imageFrame);
    await writeStream.write('\r\n--BOUNDARY_FIXED_32934857949532587--');
    await writeStream.end();
    return id.imageFrameRootPath;
};

module.exports = ImageFrameWriter;