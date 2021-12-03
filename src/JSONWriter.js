const WriteStream = require('./WriteStream')
const Stats = require('./stats');

/** Writes out JSON files to the given file name.  Automatically GZips them, and adds the extension */
const JSONWriter = async (dir, name, data, options = {gzip:true}) => {
    const fileName = name + (options.gzip ? '.gz' : '.json');
    let writeStream = WriteStream(dir,fileName, {mkdir: true, gzip: options.gzip})
    await writeStream.write(JSON.stringify(data));
    await writeStream.close();
    Stats.StudyStats.add('Write JSON', `Write JSON file ${name}`,1000);
}

module.exports=JSONWriter