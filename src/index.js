const dicomCodec = require("@cornerstonejs/dicom-codec");
const dicomParser = require("dicom-parser");
const asyncIterableToBuffer = require("./asyncIterableToBuffer");
const getDataSet = require("./getDataSet");
const JSONWriter = require("./JSONWriter");
const InstanceDeduplicate = require("./InstanceDeduplicate");
const DeduplicateWriter = require("./DeduplicateWriter");
const ImageFrameWriter = require("./ImageFrameWriter");
const CompleteStudyWriter = require("./CompleteStudyWriter");
const IdCreator = require("./IdCreator");
const fs = require("fs");
const dirScanner = require("./dirScanner");
const ScanStudy = require("./ScanStudy");
const HashDataWriter = require("./HashDataWriter");
const JSONReader = require("./JSONReader");
const path = require("path");
const homedir = require("os").homedir();
const Stats = require("./stats");
const VideoWriter = require("./VideoWriter");
const {
  transcodeImageFrame,
  transcodeId,
  transcodeMetadata,
} = require("./transcodeImage");
const configureProgram = require("./program");

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
    callback: async (file) => {
      try {
        const dicomp10stream = fs.createReadStream(file);
        await dicomp10todicomweb(dicomp10stream, callbacks, options);
        StudyStats.add("DICOM P10", "Parse DICOM P10 file");
      } catch (e) {
        console.error("Couldn't process", file, e);
      }
    },
  });
};

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
    callback: (dir, name) => callbacks.scanStudy(dir, name),
  });
};

const dicomp10todicomweb = async (dicomp10stream, callback, options) => {
  // Read dicomp10 stream into buffer
  const buffer = await asyncIterableToBuffer(dicomp10stream);

  // Parse it
  const dataSet = dicomParser.parseDicom(buffer);

  // TODO - make this a streaming parse
  // const dataSet = dicomParser.parseDicom(dicomp10stream)

  const studyInstanceUid = dataSet.string("x0020000d");

  if (!studyInstanceUid) return;

  // Extract uids
  const id = callback.uids({
    studyInstanceUid,
    seriesInstanceUid: dataSet.string("x0020000e"),
    sopInstanceUid: dataSet.string("x00080018"),
    transferSyntaxUid: dataSet.string("x00020010"),
  });

  const targetId = transcodeId(id, options);

  let bulkDataIndex = 0;
  let imageFrameIndex = 0;
  const generator = {
    bulkdata: async (bulkData) => callback.bulkdata(targetId, bulkDataIndex++, bulkData),
    imageFrame: async (originalImageFrame) => {
       const { imageFrame, id: transcodedId } = await transcodeImageFrame(
        id,
        targetId,
        originalImageFrame,
        dataSet,
        options
      );

      return callback.imageFrame(transcodedId, imageFrameIndex++, imageFrame);
    },
    videoWriter: async (_dataSet) => callback.videoWriter(id, _dataSet)
  };

  // convert to DICOMweb MetaData and BulkData
  const result = await getDataSet(dataSet, generator, options);

  const transcodedMeta = transcodeMetadata(result.metadata, id, options);

  await callback.metadata(targetId, transcodedMeta);

  // resolve promise with statistics
  return {};
};

const OverallStats = new Stats("OverallStats", "Overall statistics");
const StudyStats = new Stats("StudyStats", "Study Generation", OverallStats);

const handleHomeRelative = (dirName) =>
  dirName[0] == "~" ? path.join(homedir, dirName.substring(1)) : dirName;

const main = async (defaults) => {
  const { scanStudies } = defaults;

  // Extract program variables
  const program = configureProgram(defaults);

  const {
    maximumInlinePublicLength,
    maximumInlinePrivateLength,
    group: isGroup,
    instances: isInstanceMetadata,
    deduplicate: isDeduplicate,
    study: isStudyData,
    clean: isClean,
    recompress,
    contentType,
    colourContentType,
    dir,
    pathDeduplicated,
    pathInstances,
    removeDeduplicatedInstances,
    verbose,
    input: files,
  } = program.opts();

  dicomCodec.setConfig({ verbose });

  const directoryName = handleHomeRelative(dir);

  const options = {
    maximumInlinePublicLength,
    maximumInlinePrivateLength,
    isGroup,
    isInstanceMetadata,
    isDeduplicate,
    isStudyData,
    isClean,
    recompressType: recompress || "",
    contentType,
    colourContentType,
    directoryName,
    deduplicatedRoot: path.join(directoryName, pathDeduplicated),
    deduplicatedInstancesRoot: path.join(directoryName, pathInstances),
    removeDeduplicatedInstances,
    scanStudies,
    verbose,
  };

  const callback = {
    uids: IdCreator(options),
    bulkdata: HashDataWriter(options),
    imageFrame: ImageFrameWriter(options),
    videoWriter: VideoWriter(options),
    completeStudy: CompleteStudyWriter(options),
    metadata: InstanceDeduplicate(options),
    deduplicated: DeduplicateWriter(options),
    scanStudy: ScanStudy(options),
  };

  if (options.scanStudies) {
    // Scan one of the study directories - in this case, files is a set of study directories
    await processStudyDir(files, callback, options);
  } else {
    await processFiles(files, callback, options);
  }
  await callback.completeStudy();
  OverallStats.summarize("Completed Study Processing");
};

dicomp10todicomweb.main = main;

module.exports = dicomp10todicomweb;
