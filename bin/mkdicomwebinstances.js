#!/usr/bin/env node

const { main } = require('../src');

const defaults = {
    isStudyData: false,
    isInstanceMetadata: true,
    clean: true,
    helpShort: 'mkdicomwebinstances <dicom-part-10-files-or-directories>',
    helpLong: 'Takes DICOM part 10 files and writes the bulkdata/instance metadata.',
};

main(defaults).then(() => {
    console.log('done')
});
