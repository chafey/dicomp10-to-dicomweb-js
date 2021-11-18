const WriteStream = require('./WriteStream')

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const JSONWriter = async (dir, name, data, options = {gzip:true}) => {
    const fileName = name + (options.gzip ? '.gz' : '.json');
    let writeStream = WriteStream(dir,fileName, {mkdir: true, gzip: options.gzip})
    await writeStream.write(JSON.stringify(data, null, 1));
    await writeStream.close();
    console.log('Wrote', dir, fileName);
}

module.exports=JSONWriter