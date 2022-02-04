#! /usr/bin/env node

const { main } = require('../src');

const defaults = {
  isStudyData: false,
  isGroup: false,
  isDeduplicate: true,
  helpShort: 'mkdicomwebdeduplicated <part-10-dicom-files-or-dirs>',
  helpLong: 'Makes deduplicated instance level files from a set of DICOM part 10 files.\n'
      + 'Does not write sets of deduplicated files by default.',
};
main(defaults).then(() => {
  console.log('done');
});
