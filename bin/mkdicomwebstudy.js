#! /usr/bin/env node

const dicomp10todicomweb = require('./../src/index')
const {getArg,hasArg, getRemainingArgs, showHelp} = require('./../src/args');
const path = require('path');
const dicomwebDefaultDir = path.join(require('os').homedir(), 'dicomweb');

const {IdCreator, HashDataWriter, CompleteStudyWriter, DeduplicateWriter, InstanceDeduplicate, ImageFrameWriter, processFiles } = dicomp10todicomweb;

/**
 * The mkdicomwebstudy comand is the second phase of creating DICOMweb metadata and query results.  It only runs after
 * mkdicomwebinstances has written deduplicated data output.  
 * For each studyUID to update, the process is:
 *   1. Get a directory list of the deduplicated files - both instances and group (lists) of files
 *   2. Read the latest deduplicated file in the list, by study data.  
 *      1. For each instance in a deduplicated file, index it by SOP Instance UID
 *      2. If there are two instances with the same SOP UID, compare hash values, report if they aren't the same
 *      3. Discard the older SOP UID value
 *   3. Eliminate from the list all deduplicated files referenced by the generated file, either as hash values or SOP UID references
 *   4. Repeat at 2 until the list is empty
 *   5. Generate the hash of the study data
 *      1. If the hash exists in the deduplicated directory, then touch the file to update the hash
 *      2. Otherwise, write a new deduplicated file to a file named after the hash of the file
 *      3. Compare the deduplicated hash to the hash stored in the deduplicated.gz file, if it is the same, stop processing this study
 *      4. Write out the study/series/isntances query results, and the series level metadata files
 *      5. Write out a new deduplicated.gz file, including the updated hash value
 *      6. (Optional) Schedule another mkdicomwebstudy in +n seconds  (n=120?)
 * Optionally write out a clean studies.gz index file.
 */
const main = async () => {
    const directoryName = getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)')
    const isDeduplicate = hasArg('-e', '--deduplicate', false, 'Write deduplicate instance level data')
    const isStudyData = hasArg('-s', '--study', true, 'Write study metadata - on provided instances only (TO FIX)')
    const isGroup = isStudyData || hasArg('-g', '--group', false, 'Write combined deduplicate data')
    const isInstanceMetadata = hasArg('-i', '--instances', !(isGroup || isDeduplicate), 'Write instance metadata')
    const maximumInlinePublicLength = getArg('-m', '--maximumInlinePublicLength', 128*1024+2, 'Maximum length of public binary data')
    const maximumInlinePrivateLength = getArg(null, '--maximumInlinePrivateLength', 64, 'Maximum length of private binary data')
    const colourContentType = getArg(null, '--colourContentType', null, 'Colour content type')
    const contentType = getArg('-c', '--contentType', null, 'Content type')
    const isClean = hasArg(null,'--clean',true,'Clean the study output directory for these instances')
    const recompressType = getArg(null, '--recompress', 'uncompressed,j2k,j2p', 'List of types to recompress')

    const isHelp = hasArg('-h', '--help',false, 'Print help');

    const files = getRemainingArgs();
    if(isHelp) {
        showHelp( 
            'mkdicomweb (options) <studyUIDs or empty for all>',
            'Make DICOMweb instances from binary Part 10 DICOM files.');
        return
    }
    
    const options = {
        maximumInlinePublicLength, maximumInlinePrivateLength,
        isGroup, isInstanceMetadata, isDeduplicate,
        isStudyData, isClean,
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
