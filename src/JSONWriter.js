const zlib = require('zlib');
const fs = require('fs');

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const JSONWriter = (dir, name, data, options) => {
    if(!fs.existsSync(path)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    const path = dir + '/' + name + (options.gzip ? '.gz' : '.json');
    const rawStream = fs.createWriteStream(path)
    if( !options || !options.gzip ) {
        const writeStream = zlib.createGzip().pipe(rawStream);
    } else {
        const writeStream = rawStream;
    }
    writeStream.write(JSON.stringify(data, null, 1), () => writeStream.close());
}

module.exports=JSONWriter