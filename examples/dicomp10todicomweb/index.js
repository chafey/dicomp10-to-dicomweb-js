const dicomp10todicomweb = require('../../src')
const fs = require('fs')
const path = require('path');

const getArg = (name, def) => {
    for(let i=2; i<process.argv.length-1; i++) {
       if( process.argv[i]==name ) return process.argv[i+1];
    }
    return def;
}

const getRemainingArgs = (hasArgs) => {
    const ret = [];
    for(let i=2; i<process.argv.length; i++) {
        const val = process.argv[i];
        if( val[0]=='-' ) {
            if( hasArgs && hasArgs[val] ) i++;
            continue;
        }
        ret.push(val);
    }
    return ret;
}

const hasArgs = { '-d': true };

const main = async () => {
    const files = getRemainingArgs(hasArgs);
    if(!files.length) {
        console.log('dicomp10todicomweb (-d <outputdirectory>) <inputfiles>')
        return
    }
    const directoryName = getArg('-d', '/dicomweb');

    const options = {
        maximumInlineDataLength: 128
    }


    const callback = {
        uids: (uids) => {
            const seriesPath = path.join(directoryName, 'studies', uids.studyInstanceUid, 'series', uids.seriesInstanceUid)
            const sopInstanceRootPath = path.join(seriesPath, 'instances', uids.sopInstanceUid)
            fs.mkdirSync(sopInstanceRootPath, { recursive: true })
            const imageFrameRootPath = path.join(sopInstanceRootPath, 'frames')
            const bulkDataRootPath = path.join(seriesPath, 'bulkdata')
            return {
                ...uids,
                seriesPath,
                sopInstanceRootPath,
                imageFrameRootPath,
                bulkDataRootPath,
            }
        },
        metadata: (id, metadata) => {
            // console.log(metadata)
            const sopMetaDataPath = path.join(id.sopInstanceRootPath, 'metadata.json')
            fs.writeFileSync(sopMetaDataPath, JSON.stringify(metadata, null, 2) , 'utf-8')
            return sopMetaDataPath
        },
        bulkdata: (id, index, bulkData) => {
            if(!fs.existsSync(id.bulkDataRootPath)) {
                fs.mkdirSync(id.bulkDataRootPath, { recursive: true })
            }
            // TODO - fix this path
            const bulkDataPath = path.join(id.bulkDataRootPath, '' + index)
            fs.writeFileSync(bulkDataPath, bulkData)
            return '../../'+bulkDataPath
        },
        imageFrame: (id, index, imageFrame) => {
            if(!fs.existsSync(id.imageFrameRootPath)) {
                fs.mkdirSync(id.imageFrameRootPath, { recursive: true })
            }
            const imageFramePath = path.join(id.imageFrameRootPath, '' + index)
            fs.writeFileSync(imageFramePath, imageFrame)
            return id.imageFrameRootPath
        }
    }

    processFiles(files, callback,options);
}

const processFiles = async (files,callback, options) => {
    for(let i=0; i<files.length; i++) {
        const file = files[i];
        console.log('Processing', file);
        if( fs.lstatSync(file).isDirectory() ) {
          console.log('Path is a directory', file);
          fs.readdir(file, async (err,dirFiles) => {
              await processFiles(dirFiles.map(dirFile => file+'/'+dirFile), callback, options);
          });
          
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

main()
.then(()=> {
    console.log('done2')
})