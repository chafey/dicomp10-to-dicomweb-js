#! /usr/bin/env node

const dicomp10todicomweb = require('./../src/index')
const {getArg,hasArg, getRemainingArgs, showHelp} = require('./../src/args');
const path = require('path');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {
    IdCreator,
    HashDataWriter, 
    CompleteStudyWriter, 
    DeduplicateWriter, 
    InstanceDeduplicate, 
    ImageFrameWriter, 
    processFiles,
    processStudyDir,
    ScanStudy,
 } = dicomp10todicomweb;

/**
 * The mkdicomweb command first runs mkdicomwebinstances, writing out the deduplicated data, and then runs the
 * mkdicomwebstudy command, creating the deduplicated data set.  This version, however, keeps the deduplicated
 * data in memory by default on a study level, which avoids needing to run the load process.
 */
const main = async defaults => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)')
    const isDeduplicate = hasArg('-e', '--deduplicate', defaults.isDeduplicate, 'Write deduplicate instance level data')
    const isStudyData = hasArg('-s', '--study', defaults.isStudyData, 'Write study metadata - on provided instances only (TO FIX)')
    const isGroup = hasArg('-g', '--group', defaults.isGroup, 'Write combined deduplicate data')
    const isInstanceMetadata = hasArg('-i', '--instances', defaults.isInstanceMetadata, 'Write instance metadata')
    const removeDeduplicatedInstances = hasArg(null,'--removeDeduplicatedInstances', defaults.removeDeduplicatedInstances,
      'Remove single instance deduplicated files after writing group files.')
    const maximumInlinePublicLength = getArg('-m', '--maximumInlinePublicLength', 128*1024+2, 'Maximum length of public binary data')
    const maximumInlinePrivateLength = getArg(null, '--maximumInlinePrivateLength', 64, 'Maximum length of private binary data')
    const colourContentType = getArg(null, '--colourContentType', null, 'Colour content type')
    const contentType = getArg('-c', '--contentType', null, 'Content type')
    const deduplicatedRoot = getArg(null,'--deduplicatedRoot', path.join(directoryName,'deduplicated'), 'Set the deduplicate data directory');
    const deduplicatedInstancesRoot = getArg(null,'--deduplicatedInstances', path.join(directoryName,'instances'), 
      'Set the deduplicate instances root directory');
    const isClean = hasArg(null,'--clean',defaults.clean,'Clean the study output directory for these instances')
    const recompressType = getArg(null, '--recompress', 'uncompressed,j2k,j2p', 'List of types to recompress')
    const {scanStudies} = defaults;
    const verbose = hasArg('-v', '--verbose', false, 'Write verbose output')

    const isHelp = hasArg('-h', '--help',false, 'Print help');

    const files = getRemainingArgs();
    if((!scanStudies && !files.length) || isHelp) {
        showHelp( 
            defaults.helpShort || 'mkdicomweb (options) <inputfiles>',
            defaults.helpLong || 
            'Make DICOMweb query and metadata from binary Part 10 DICOM files.  Does a full read of\n'+
            'deduplicated files each time a study instance UID is found, and only updates those studies\n'+
            'having at least one ');
        return
    }
    
    const options = {
        maximumInlinePublicLength, maximumInlinePrivateLength,
        isGroup, isInstanceMetadata, isDeduplicate,
        isStudyData, isClean,
        recompressType, contentType, colourContentType,
        directoryName, 
        deduplicatedRoot,
        deduplicatedInstancesRoot, 
        removeDeduplicatedInstances,
        scanStudies,
        verbose,
    }

    const callback = {
        uids: IdCreator(options),
        bulkdata: HashDataWriter(options),
        imageFrame: ImageFrameWriter(options),
        completeStudy: CompleteStudyWriter(options),
        metadata: InstanceDeduplicate(options),
        deduplicated: DeduplicateWriter(options),
        scanStudy: ScanStudy(options),
    }

    if( options.scanStudies ) {
      // Scan one of the study directories - in this case, files is a set of study directories
      await processStudyDir(files, callback, options);
    } else {
      await processFiles(files, callback, options);
    }
    await callback.completeStudy();
}

main.commandName = name => {
    const argName = process.argv[1];
    if( !argName ) return false;
    const index = argName.indexOf(name);
    return index!=-1 && (index+name.length==argName.length || index==argName.indexOf(`${name}.js`) )   
}

// Only run the main when the command line is the mkdicomweb one
if( main.commandName('mkdicomweb') ) {
    const defaults = {
        isStudyData: true,
        isGroup: true,
    };
    main(defaults).then(()=> {
        console.log('done')
    });
}

module.exports = main;