#! /usr/bin/env node

console.log('Hello mkdicomweb');

const dicomp10todicomweb = require('./../src/index')
const fs = require('fs')
const path = require('path');
const { JSONWriter } = require('./../src/index');

const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {JSONReader, HashDataWriter, CompleteStudyWriter, DeduplicateWriter, InstanceDeduplicate, ImageFrameWriter } = dicomp10todicomweb;

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
        metadata: async (id, metadata) => await JSONWriter(id.sopInstanceRootPath,'metadata',metadata), 
        bulkdata: async (id, index, bulkData) => await HashDataWriter(id,index,bulkData),
        imageFrame: ImageFrameWriter,
        completeStudy: () => {
            this.studyInstanceUid = null;
            this.deduplicatedInstances = null;
            this.extractData = null;
        }
    }

    if( deduplicate ) {
        callback.completeStudy = CompleteStudyWriter;
        callback.hashdata = HashDataWriter;
        callback.deduplicated = DeduplicateWriter;
        callback.metadata = InstanceDeduplicate;
    }
    
    callback.allStudies = await JSONReader(directoryName, "studies.gz", []);

    await processFiles(files, callback,options);

    // Finalize things if needed
    await callback.completeStudy();
    console.log(`There are ${callback.allStudies.length} studies`);
    await JSONWriter(directoryName,"studies", callback.allStudies);
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