#! /usr/bin/env node

const dicomp10todicomweb = require('../src/index')
const { getArg, hasArg, getRemainingArgs, showHelp } = require('../src/args');
const path = require('path');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const { JSONWriter, IdCreator, HashDataWriter, CompleteStudyWriter,
    DeduplicateWriter, InstanceDeduplicate,
    ImageFrameWriter, processFiles } = dicomp10todicomweb;


const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)')
    const groupOnly = hasArg('-g', '--groupOnly', 'Only write group deduplicated files')
    const noGroup = hasArg('-n', '--noGroup', 'Do not write group files') || instanceData
    const isHelp = hasArg('-h', '--help', 'Print help');
    const files = getRemainingArgs();
    if (!files.length || isHelp) {
        showHelp(
            'mkdicomwebstudy (options)',
            'Make DICOMweb study information from deduplicated files.\n' +
            'Deduplicated files can be written by mkdicomwebinstances');
        return
    }


    const options = {
        maximumInlineDataLength: 128
    }

    const callback = {
        uids: IdCreator(directoryName),
        bulkdata: async (id, index, bulkData) => await HashDataWriter(id, index, bulkData),
        imageFrame: ImageFrameWriter,
        completeStudy: () => null,
        metadata: async (id, metadata) => await JSONWriter(id.sopInstanceRootPath, 'metadata', metadata),
        deduplicated: DeduplicateWriter.perInstance,
    }
    if (deduplicate) {
        if (instanceData) {
            // Write the instance metadata too
            callback.instanceMetadata = callback.metadata;
        }
        callback.metadata = InstanceDeduplicate;
    }
    await processFiles(files, callback, options);
}

main().then(() => {
    console.log('done2')
});
