#! /usr/bin/env node

const { main } = require("../src");

const defaults = {
  isStudyData: false,
  isGroup: false,
  isDeduplicate: true,
  optionsRequired: ["-i"],
  helpShort: "mkdicomwebdeduplicated",
  helpDescription:
    "Makes deduplicated instance level files from a set of DICOM part 10 files.\n" +
    "Does not write sets of deduplicated files by default.",
};
main(defaults).then(() => {
  console.log("done");
});
