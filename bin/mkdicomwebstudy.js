#! /usr/bin/env node

const { main } = require('../src');

const defaults = {
    isStudyData: true,
    scanStudies: 'deduplicatedRoot',
    helpShort: 'mkdicomwebstudy <study-uids>',
    helpLong:
      'Scans the deduplicated directory for studies, and generates the study metadata.\n'+
      'No updates are performed on any study where the deduplicated hash value is identical to the\n'+
      'hash value of the latest deduplicated file.',
};
main(defaults).then(() => {
    console.log('done')
});
