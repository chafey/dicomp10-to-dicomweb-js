#!/usr/bin/env node

const { main } = require('../src');

const defaults = {
    isStudyData: false,
    isInstanceMetadata: true,
    clean: true,
    optionsRequired: ['-i'],
    helpShort: 'mkdicomwebinstances',
    helpDescription: 'Takes DICOM part 10 files and writes the bulkdata/instance metadata.',
};
main(defaults).then(() => {
    console.log('done')
});
