const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const JSONWriter = async (dir, name, data, options = {gzip:true}) => {
    if(!fs.existsSync(dir)) {
        console.log('Trying to create path', dir);
        fs.mkdirSync(dir, { recursive: true })
    }
    const fileName = dir + '/' + name + (options.gzip ? '.gz' : '.json');
    const rawStream = fs.createWriteStream(fileName)
    let writeStream;
    if( options.gzip ) {
        console.log('Writing gzip stream to', fileName);
        writeStream = zlib.createGzip();
        writeStream.on('error', err => console.warn('Error:',err));
        writeStream.pipe(rawStream);
    } else {
        console.log('Writing raw JSON stream to', fileName);
        writeStream = rawStream;
    }
    await writeStream.write(JSON.stringify(data, null, 1));
    writeStream.end();
}

module.exports=JSONWriter