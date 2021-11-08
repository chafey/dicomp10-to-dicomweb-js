const dicomp10todicomweb = require('./index')
const fs = require('fs')
const path = require('path');

const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {HashDataWriter, DeduplicateWriter, InstanceDeduplicate } = dicomp10todicomweb;

const allArgs = {};

const getArg = (name, longName, def, description) => {
    allArgs[name || longName] = {hasArg: true, longName, description};
    for(let i=2; i<process.argv.length-1; i++) {
       if( process.argv[i]==name ) return process.argv[i+1];
    }
    return def;
}

const hasArg = (name,longName, description) => {
    allArgs[name || longName] = {hasArg: false, longName, description};
    for(let i=2; i<process.argv.length; i++) {
        const val = process.argv[i];
        if( val==name || val==longName ) return true;
    }
}

const getRemainingArgs = () => {
    const ret = [];
    for(let i=2; i<process.argv.length; i++) {
        const val = process.argv[i];
        const argVal = allArgs[val];
        if( argVal ) {
            if( argVal && argVal.hasArg ) i++;
            continue;
        }
        ret.push(val);
    }
    return ret;
}


const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)');
    const deduplicate = hasArg('-e', '--deduplicate', 'Store deduplicated data to <studyUID>/deduplicated directory');
    const isHelp = hasArg('-h', '--help', 'Print help');
    const files = getRemainingArgs(allArgs);
    const isInstances = hasArg('-i', '--instances', 'Write instance metadata, true if deduplicate is false');
    if(!files.length || isHelp) {
        console.log('dicomp10todicomweb (options) <inputfiles>')
        Object.keys(allArgs).forEach( name => {
            const arg = allArgs[name];
            console.log(`  ${name} ${name!=arg.longName && arg.longName} ${arg.description}`)
        });
        return
    }
    
    const options = {
        maximumInlineDataLength: 128
    }


    const callback = {
        uids: (uids) => {
            const studyPath = path.join(directoryName, 'studies', uids.studyInstanceUid)
            const sopInstanceRootPath = path.join(studyPath, 'series', uids.seriesInstanceUid, 'instances', uids.sopInstanceUid)
            const deduplicatedPath = path.join(studyPath,'deduplicated');
            fs.mkdirSync(sopInstanceRootPath, { recursive: true })
            fs.mkdirSync(deduplicatedPath, {recursive: true })
            const imageFrameRootPath = path.join(sopInstanceRootPath, 'frames')
            return {
                ...uids,
                studyPath,
                deduplicatedPath,
                sopInstanceRootPath,
                imageFrameRootPath,
            }
        },
        metadata: (id, metadata) => {
            // console.log(metadata)
            if( deduplicate && !isInstances ) return;
            const sopMetaDataPath = path.join(id.sopInstanceRootPath, 'metadata.json')
            console.log('Writing metadata to', sopMetaDataPath);
            fs.writeFileSync(sopMetaDataPath, JSON.stringify(metadata, null, 2) , 'utf-8')
            return sopMetaDataPath
        },
        bulkdata: async (id, index, bulkData) => await HashDataWriter(id,index,bulkData),
        imageFrame: (id, index, imageFrame) => {
            if(!fs.existsSync(id.imageFrameRootPath)) {
                fs.mkdirSync(id.imageFrameRootPath, { recursive: true })
            }
            const imageFramePath = path.join(id.imageFrameRootPath, '' + index)
            fs.writeFileSync(imageFramePath, imageFrame)
            return id.imageFrameRootPath
        },
    }

    if( deduplicate ) {
        callback.hashdata = HashDataWriter;
        callback.deduplicated = DeduplicateWriter();
        callback.metadata = new InstanceDeduplicate(callback).bindMetadata();
    }

    await processFiles(files, callback,options);

    // Finalize things if needed
    if(callback.deduplicated ) callback.deduplicated({});
}

const processFiles = async (files,callback, options) => {
    for(let i=0; i<files.length; i++) {
        const file = files[i];
        console.log('Processing', file);
        if( fs.lstatSync(file).isDirectory() ) {
          console.log('Path is a directory', file);
          const names = await fs.promises.readdir(file);
          await processFiles(names.map(dirFile => file+'/'+dirFile), callback, options);          
        } else {
          try {
            const dicomp10stream = fs.createReadStream(file);
            await dicomp10todicomweb(dicomp10stream, callback, options);
          } catch(e) {
              console.error("Couldn't process", file, e);
          }
        }
    }
}

main().then(()=> {
        console.log('done2')
    });
