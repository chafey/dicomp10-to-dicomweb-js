const { program, Argument } = require("commander");
const package = require("../package.json");

const dicomwebDefaultDir = "~/dicomweb";

program.version(package.version);

function configureBaseProgram(configuration) {
  const {
    helpDescription,
    helpShort,
  } = configuration;

  program
    .name(helpShort)
    .configureHelp({ sortOptions: true })
    .addHelpText("beforeAll", helpDescription)
    .addHelpCommand();

  return program;
}

/**
 * Configure commander program. Ideally it should be called just once.
 * Used by Dicomwebscp command (dicom web service class provider command).
 * 
 * @param {*} configuration Configuration object from command level
 * @returns Program object
 */
function configureServerProgram(configuration) {
  const _program = configureBaseProgram(configuration);
  
  // no options or arguments set yet
  _program.parse();

  return _program;
}
/**
 * Configure commander program. Ideally it should be called just once.
 * Used by StaticWado commands.
 * 
 * @param {*} configuration Configuration object from command level
 * @returns Program object
 */
function configureProgram(configuration) {
  const {
    argumentsRequired = [],
    optionsRequired = [],
  } = configuration;

  const _program = configureBaseProgram(configuration);

  const argumentList = [
    {
      key: "<input...>",
      description: "List of files/directories/studyUids to be processed",
    },
  ];

  // program command options
  argumentsRequired.forEach((argName) => {
    argumentList.forEach((argObject) => {
      if (argObject.key.includes(argName)) {
        program.addArgument(new Argument(argObject.key, argObject.description));
      }
    });
  });

  // program command options
  const options = [
    {
      key: "-c, --clean",
      description: "Clean the study output directory for these instances",
      defaultValue: configuration.clean || false,
    },
    {
      key: "-d, --deduplicate",
      description: "Write deduplicate instance level data",
      defaultValue: configuration.isDeduplicate || false,
    },
    {
      key: "-g, --group",
      description: "Write combined deduplicate data",
      defaultValue: configuration.isGroup || false,
    },
    {
      key: "-i, --instances",
      description: "Write instance metadata",
      defaultValue: configuration.isInstanceMetadata || false,
    },
    {
      key: "-s, --study",
      description:
        "Write study metadata - on provided instances only (TO FIX},",
      defaultValue: configuration.isStudyData || false,
    },
    {
      key: "-C, --remove-deduplicated-instances",
      description:
        "Remove single instance deduplicated files after writing group files",
      defaultValue: configuration.removeDeduplicatedInstances || false,
    },
    {
      key: "-v, --verbose",
      description: "Write verbose output",
      defaultValue: false,
    },
    {
      key: "-T, --colour-content-type <value>",
      description: "Colour content type",
      defaultValue: null,
    },
    {
      key: "-t, --content-type <type>",
      description: "Content type",
      defaultValue: null,
    },
    {
      key: "-i, --input <input...>",
      description: "List of files/directories/studyUids to be processed",
      defaultValue: undefined,
    },
    {
      key: "-m, --maximum-inline-public-length <value>",
      description: "Maximum length of public binary data",
      defaultValue: 128 * 1024 + 2,
    },
    {
      key: "-o, --dir <value>",
      description: "Set output directory",
      defaultValue: dicomwebDefaultDir,
    },
    {
      key: "-M, --maximum-inline-private-length <value>",
      description: "Maximum length of private binary data",
      defaultValue: 64,
    },
    {
      key: "-r, --recompress <listvalue...>",
      description: "List of types to recompress separated by comma",
      defaultValue: ["uncompressed", "jp2"],
      choices: ["uncompressed", "jp2", "jpeglossless", "rle"],
    },
    {
      key: "--no-recompress",
      description: "Force no recompression",
      defaultValue: false,
    },
    {
      key: "--path-deduplicated <path>",
      description: "Set the deduplicate data directory path (relative to dir)",
      defaultValue: "deduplicated",
    },
    {
      key: "--path-instances <path>",
      description: "Set the instances directory path (relative to dir)",
      defaultValue: "instances",
    },
  ];

  options.forEach(({ key, description, defaultValue, choices }) => {
    const option = _program.createOption(key, description);

    option.default(defaultValue);

    if (
      optionsRequired.includes(option.short) ||
      optionsRequired.includes(option.long)
    ) {
      option.makeOptionMandatory();
    }

    if (Array.isArray(choices)) {
      option.choices(choices);
    }

    _program.addOption(option);
  });

  _program.parse();

  return _program;
}

exports.configureServerProgram = configureServerProgram;
exports.configureProgram = configureProgram;
