const dicomParser = require('dicom-parser')
const asyncIterableToBuffer = require('./asyncIterableToBuffer')
const getDataSet = require('./getDataSet')
const JSONWriter = require('./JSONWriter')
const InstanceDeduplicate = require('./InstanceDeduplicate')
const DeduplicateWriter = require('./DeduplicateWriter')
const ImageFrameWriter = require('./ImageFrameWriter');
const CompleteStudyWriter = require('./CompleteStudyWriter');
const IdCreator = require('./IdCreator');
const fs = require('fs')
const dirScanner = require('./dirScanner')
const ScanStudy = require('./ScanStudy')
const HashDataWriter = require('./HashDataWriter')
const JSONReader = require('./JSONReader')

/**
 * Processes a set of DICOM files, where the starting point is a list of directory names or file instances.
 * This is used for importing DICOM files.
 * 
 * @param {*} files 
 * @param {*} callback 
 * @param {*} options 
 */
const processFiles = async (files, callbacks, options) => {
    return await dirScanner(files, {
        ...options,
        callback: async file => {
            try {
                const dicomp10stream = fs.createReadStream(file);
                await dicomp10todicomweb(dicomp10stream, callbacks, options);
            } catch (e) {
                console.error("Couldn't process", file, e);
            }
        }
    })
}

/**
 * Processes a study directory, matching up study instance UIDs.  Either processes the 
 * deduplicated group directory or the instances directory, or the notifications directory.
 * @param {*} callback 
 * @param {*} options 
 */
const processStudyDir = async (studyUids, callbacks, options) => {
    return await dirScanner(options[options.scanStudies], {
        ...options,
        recursive: false,
        callback: (dir,name) => callbacks.scanStudy(dir,name) 
    });
};

/**
 * Processes deduplicated instance data. 
 * options contains various flags controlling the process:
 *   notificationDirectory - the directory to read the study list from, defaults to
 *     directoryName/studies
 *   studies - a list of study instance UID's to update
 * 
 * Scans the notification directory for a list of studies (matching up with the provided list if it is present)
 * Then, sends a notification to the callback  deduplicatedReader with an ID consisting of hte study
 * UID/directory set, and the file name for the options directory.  The deduplicatedReader is then responsible
 * for reading the full directory tree.
 */
const processDeduplicated = async (options, callback) => {
    throw new Error('Not yet implemented');
}

const dicomp10todicomweb = async (dicomp10stream, callback, options) => {
    // Read dicomp10 stream into buffer
    const buffer = await asyncIterableToBuffer(dicomp10stream)

    // Parse it
    const dataSet = dicomParser.parseDicom(buffer)

    // TODO - make this a streaming parse
    // const dataSet = dicomParser.parseDicom(dicomp10stream)

    const studyInstanceUid = dataSet.string('x0020000d')

    if( !studyInstanceUid ) return;

    // Extract uids
    const id = callback.uids({
        studyInstanceUid,
        seriesInstanceUid: dataSet.string('x0020000e'),
        sopInstanceUid: dataSet.string('x00080018'),
        transferSyntaxUid: dataSet.string('x00020010')
    })

    let bulkDataIndex = 0
    let imageFrameIndex = 0
    const generator = {
        bulkdata: async (bulkData) =>
            await callback.bulkdata(id, bulkDataIndex++, bulkData),
        imageFrame: async (imageFrame) =>
            await callback.imageFrame(id, imageFrameIndex++, imageFrame)
    }

    // convert to DICOMweb MetaData and BulkData
    const result = await getDataSet(dataSet, generator, options);

    await callback.metadata(id, result.metadata)

    // resolve promise with statistics
    return {}
}

// Add help applications
dicomp10todicomweb.JSONWriter = JSONWriter;
dicomp10todicomweb.HashDataWriter = HashDataWriter;
dicomp10todicomweb.DeduplicateWriter = DeduplicateWriter;
dicomp10todicomweb.InstanceDeduplicate = InstanceDeduplicate;
dicomp10todicomweb.ImageFrameWriter = ImageFrameWriter;
dicomp10todicomweb.CompleteStudyWriter = CompleteStudyWriter;
dicomp10todicomweb.JSONReader = JSONReader;
dicomp10todicomweb.processFiles = processFiles;
dicomp10todicomweb.IdCreator = IdCreator;
dicomp10todicomweb.processStudyDir = processStudyDir;
dicomp10todicomweb.ScanStudy = ScanStudy;

module.exports = dicomp10todicomweb