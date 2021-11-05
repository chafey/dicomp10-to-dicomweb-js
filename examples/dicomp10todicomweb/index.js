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

    let sopInstanceRootPath
    let imageFrameRootPath
    let bulkDataRootPath

    const callback = {
        uids: (uids) => {
            sopInstanceRootPath = path.join(directoryName, uids.studyInstanceUid, 'series', uids.seriesInstanceUid, 'instances', uids.sopInstanceUid)
            fs.mkdirSync(sopInstanceRootPath, { recursive: true })
            imageFrameRootPath = path.join(sopInstanceRootPath, 'frames')
            bulkDataRootPath = path.join(sopInstanceRootPath, 'bulkdata')
        },
        metadata: (metadata) => {
            // console.log(metadata)
            const sopMetaDataPath = path.join(sopInstanceRootPath, 'metadata')
            fs.writeFileSync(sopMetaDataPath, JSON.stringify(metadata, null, 2) , 'utf-8')
        },
        bulkdata: (index, bulkData) => {
            if(!fs.existsSync(bulkDataRootPath)) {
                fs.mkdirSync(bulkDataRootPath, { recursive: true })
            }
            const bulkDataPath = path.join(bulkDataRootPath, '' + index)
            fs.writeFileSync(bulkDataPath, bulkData)
        },
        imageFrame: (index, imageFrame) => {
            if(!fs.existsSync(imageFrameRootPath)) {
                fs.mkdirSync(imageFrameRootPath, { recursive: true })
            }
            const imageFramePath = path.join(imageFrameRootPath, '' + index)
            fs.writeFileSync(imageFramePath, imageFrame)
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
              console.error("Couldn't process", file);
          }
        }
    }
}

main()
.then(()=> {
    console.log('done2')
})