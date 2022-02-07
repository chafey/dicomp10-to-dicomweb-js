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
const { getArg, hasArg, getRemainingArgs, showHelp } = require('./../src/args');
const path = require('path');
const homedir = require('os').homedir();

const dicomwebDefaultDir = '~/dicomweb';
const Stats = require('./stats');
const VideoWriter = require('./VideoWriter')
const OverallStats = new Stats('OverallStats', 'Overall statistics');
const StudyStats = new Stats('StudyStats', 'Study Generation', OverallStats);
const handleHomeRelative = dirName => dirName[0] == '~' ? (path.join(homedir, dirName.substring(1))) : dirName;

class StaticWado {
    constructor(defaults) {
        const directoryName = handleHomeRelative(getArg('-d', '--directory', dicomwebDefaultDir, 'Set output directory (~/dicomweb)'))
        const isDeduplicate = hasArg('-e', '--deduplicate', defaults.isDeduplicate, 'Write deduplicate instance level data')
        const isStudyData = hasArg('-s', '--study', defaults.isStudyData, 'Write study metadata - on provided instances only (TO FIX)')
        const isGroup = hasArg('-g', '--group', defaults.isGroup, 'Write combined deduplicate data')
        const isInstanceMetadata = hasArg('-i', '--instances', defaults.isInstanceMetadata, 'Write instance metadata')
        const removeDeduplicatedInstances = hasArg(null, '--removeDeduplicatedInstances', defaults.removeDeduplicatedInstances,
            'Remove single instance deduplicated files after writing group files.')
        const maximumInlinePublicLength = getArg('-m', '--maximumInlinePublicLength', 128 * 1024 + 2, 'Maximum length of public binary data')
        const maximumInlinePrivateLength = getArg(null, '--maximumInlinePrivateLength', 64, 'Maximum length of private binary data')
        const colourContentType = getArg(null, '--colourContentType', null, 'Colour content type')
        const contentType = getArg('-c', '--contentType', null, 'Content type')
        const deduplicatedRoot = getArg(null, '--deduplicatedRoot', path.join(directoryName, 'deduplicated'), 'Set the deduplicate data directory');
        const deduplicatedInstancesRoot = getArg(null, '--deduplicatedInstances', path.join(directoryName, 'instances'),
            'Set the deduplicate instances root directory');
        const isClean = hasArg(null, '--clean', defaults.clean, 'Clean the study output directory for these instances')
        const recompressType = getArg(null, '--recompress', 'uncompressed,j2k,j2p', 'List of types to recompress')
        const { scanStudies } = defaults;
        const verbose = hasArg('-v', '--verbose', false, 'Write verbose output')

        const isHelp = hasArg('-h', '--help', false, 'Print help');

        this.files = getRemainingArgs();
        if (isHelp) {
            showHelp(
                defaults.helpShort || 'mkdicomweb (options) <inputfiles>',
                defaults.helpLong ||
                'Make DICOMweb query and metadata from binary Part 10 DICOM files.  Does a full read of\n' +
                'deduplicated files each time a study instance UID is found, and only updates those studies\n' +
                'having at least one ');
            process.exit(0);
        }

        this.options = {
            TransferSyntaxUID: '1.2.840.10008.1.2',
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

        this.callback = {
            uids: IdCreator(this.options),
            bulkdata: HashDataWriter(this.options),
            imageFrame: ImageFrameWriter(this.options),
            videoWriter: VideoWriter(this.options),
            completeStudy: CompleteStudyWriter(this.options),
            metadata: InstanceDeduplicate(this.options),
            deduplicated: DeduplicateWriter(this.options),
            scanStudy: ScanStudy(this.options),
        }
    }

    /**
     * Processes a set of DICOM files, where the starting point is a list of directory names or file instances.
     * This is used for importing DICOM files.
     * 
     * @param {*} files 
     * @param {*} callback 
     * @param {*} params 
     */
    async processFiles(files, params) {
        return dirScanner(files, {
            ...params,
            callback: async file => {
                try {
                    const dicomp10stream = fs.createReadStream(file);
                    await this.importBinaryDicom(dicomp10stream, params);
                    StudyStats.add('DICOM P10', 'Parse DICOM P10 file');
                } catch (e) {
                    console.error("Couldn't process", file, e);
                }
            }
        })
    }

    /**
     * Processes a study directory, matching up study instance UIDs.  Either processes the 
     * deduplicated group directory or the instances directory, or the notifications directory.
     * @param {*} params 
     */
    async processStudyDir(studyUids, params) {
        return dirScanner(params[params.scanStudies], {
            ...params,
            recursive: false,
            callback: (dir, name) => this.callback.scanStudy(dir, name)
        });
    };

    async importBinaryDicom(dicomp10stream, params) {
        // Read dicomp10 stream into buffer
        const buffer = await asyncIterableToBuffer(dicomp10stream)

        // Parse it
        const dataSet = dicomParser.parseDicom(buffer, params)

        const studyInstanceUid = dataSet.string('x0020000d')

        if (!studyInstanceUid) {
            throw new Error(`Can't import dataSet ${dataSet}`);
        }

        // Extract uids
        const id = this.callback.uids({
            studyInstanceUid,
            seriesInstanceUid: dataSet.string('x0020000e'),
            sopInstanceUid: dataSet.string('x00080018'),
            transferSyntaxUid: dataSet.string('x00020010')
        })

        let bulkDataIndex = 0
        let imageFrameIndex = 0
        const generator = {
            bulkdata: async (bulkData) =>
                await this.callback.bulkdata(id, bulkDataIndex++, bulkData),
            imageFrame: async (imageFrame) =>
                await this.callback.imageFrame(id, imageFrameIndex++, imageFrame),
            videoWriter: async (dataSet) =>
                await this.callback.videoWriter(id, dataSet),
        }

        // convert to DICOMweb MetaData and BulkData
        const result = await getDataSet(dataSet, generator, this.options);

        await this.callback.metadata(id, result.metadata)

        // resolve promise with statistics
        return {}
    }


    /**
     * The mkdicomweb command first runs mkdicomwebinstances, writing out the deduplicated data, and then runs the
     * mkdicomwebstudy command, creating the deduplicated data set.  This version, however, keeps the deduplicated
     * data in memory by default on a study level, which avoids needing to run the load process.
     */
    async main() {
        if (this.options.scanStudies) {
            // Scan one of the study directories - in this case, files is a set of study directories
            await this.processStudyDir(this.files, this.options);
        } else {
            await this.processFiles(this.files, this.options);
        }
        await this.close();
    }

    async close() {
        await this.callback.completeStudy();
        OverallStats.summarize('Completed Study Processing');
    }

    static main(defaults) {
        const importer = new StaticWado(defaults);
        return importer.main();
    }
}

module.exports = StaticWado