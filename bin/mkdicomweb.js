#! /usr/bin/env node

const dicomp10todicomweb = require('./../src/index')
const {getArg,hasArg, getRemainingArgs, showHelp} = require('./../src/args');
const fs = require('fs')
const path = require('path');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const { JSONWriter } = require('./../src/index');

const {processFiles, JSONReader, IdCreator, HashDataWriter, CompleteStudyWriter, DeduplicateWriter, InstanceDeduplicate, ImageFrameWriter } = dicomp10todicomweb;

const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)');
    hasArg('-e', '--deduplicate', 'Legacy argument, not required');
    const isHelp = hasArg('-h', '--help', 'Print help');
    const files = getRemainingArgs();
    const isInstances = hasArg('-i', '--instances', 'Write instance level metadata');
    if(!files.length || isHelp) {
        showHelp( 
            'mkdicomweb (options) <inputfiles>',
            'Make DICOMweb study/series query and series metadata from binary Part 10 DICOM files.');
        return
    }
    
    const options = {
        maximumInlineDataLength: 128
    }

    const callback = {
        uids: IdCreator(directoryName),
        bulkdata: async (id, index, bulkData) => await HashDataWriter(id,index,bulkData),
        imageFrame: ImageFrameWriter,
        completeStudy: CompleteStudyWriter,
        hashdata: HashDataWriter,
        deduplicated: DeduplicateWriter,
        metadata: InstanceDeduplicate,
    }

    if( isInstances ) {
        callback.instanceMetadata = async (id, metadata) => await JSONWriter(id.sopInstanceRootPath,'metadata',metadata);
    }
    
    callback.allStudies = await JSONReader(directoryName, "studies.gz", []);

    await processFiles(files, callback,options);

    // Finalize things if needed
    await callback.completeStudy();
    console.log(`There are ${callback.allStudies.length} studies`);
    await JSONWriter(directoryName,"studies", callback.allStudies);
}

main().then(()=> {
        console.log('done2')
    });
