#! /usr/bin/env node

const dicomp10todicomweb = require('./../src/index')
const {getArg,hasArg, getRemainingArgs, showHelp} = require('./../src/args');
const path = require('path');
const { JSONWriter } = require('./../src/index');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {IdCreator, HashDataWriter, CompleteStudyWriter, DeduplicateWriter, InstanceDeduplicate, ImageFrameWriter, processFiles } = dicomp10todicomweb;

const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)')
    const isDeduplicate = hasArg('-e', '--deduplicate', false, 'Write deduplicate instance level data')
    const isStudyData = hasArg('-s', '--study', false, 'Write study metadata - on provided instances only')
    const isGroup = isStudyData || hasArg('-g', '--group', false, 'Write combined deduplicate data')
    const isInstanceMetadata = hasArg('-i', '--instances', !(isGroup || isDeduplicate), 'Write instance metadata')
    const isClean = hasArg(null,'--clean',true,'Clean the study output directory for these instances')
    const maximumInlinePublicLength = getArg('-m', '--maximumInlinePublicLength', 128*1024+2, 'Maximum length of public binary data')
    const maximumInlinePrivateLength = getArg(null, '--maximumInlinePrivateLength', 64, 'Maximum length of private binary data')
    const colourContentType = getArg(null, '--colourContentType', null, 'TODO Colour content type')
    const contentType = getArg('-c', '--contentType', null, 'TODO Content type')
    const recompressType = getArg(null, '--recompress', 'uncompressed,j2k,j2p', 'TODO List of types to recompress')

    const isHelp = hasArg('-h', '--help',false, 'Print help');

    const files = getRemainingArgs();
    if(!files.length || isHelp) {
        showHelp( 
            'mkdicomwebinstances (options) <inputfiles>',
            'Make DICOMweb instances from binary Part 10 DICOM files.\n'+
            'The mkdicomwebinstances takes as input a set of DICOM files.  It then writes out instance level data\n'+
            'as a summary of each dicom file read.  The default output is to just write the bulkdata, pixel data\n'+
            'and instance level metadata files, however other options are possible.\n'+
            ' \n'+
            'The -e option writes out <studyUID>/deduplicated/instances/<HASH-KEY>.gz files that contain a reduced\n'+
            'set of data.  These files also reference instances within the bulkdata directory which contain the\n'+
            'removed data.\n'+
            ' \n'+
            'The -g writes out the same data as the -d, but writes it instead to files containing a list of the same\n'+
            'data as would be generated for the -e option.\n'+
            ' \n'+
            'The -s option takes the data generated ONLY in this phase and writes it out as study/series/instances query results,\n'+
            'as well as the series level metadata.  This option allows a quick creation of a complete, viewable study\n'+
            'based on study data which doesn't exist.  \n'+
            '\n'+
            'TODO - implement type conversion when required to convert images from one format to another.\n'
           );
        return
    }
    
    const options = {
        maximumInlinePublicLength, maximumInlinePrivateLength,
        isGroup, isInstanceMetadata, isDeduplicate, isClean,
        isStudyData,
        recompressType, contentType, colourContentType,
        directoryName,
    }

    const callback = {
        uids: IdCreator(options),
        bulkdata: HashDataWriter(options),
        imageFrame: ImageFrameWriter(options),
        completeStudy: CompleteStudyWriter(options),
        metadata: InstanceDeduplicate(options),
        deduplicated: DeduplicateWriter(options),
    }

    await processFiles(files, callback, options);
    await callback.completeStudy();
}

main().then(()=> {
        console.log('done')
    });
