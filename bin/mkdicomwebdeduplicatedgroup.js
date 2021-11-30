#! /usr/bin/env node

const { main } = require('../src');

const defaults = {
    isStudyData: false,
    scanStudies: 'deduplicatedInstancesRoot',
    isGroup: true,
    removeDeduplicatedInstances: true,
    helpShort: 'mkdicomwebdeduplicatedgroup <optional-study-uid-list>',
    helpLong: 'Makes sets of deduplicated instances out of the single instance deduplicated data.\n'+
      'Scans the dicomweb/instances directory to find data, then deletes it by default.',
};
main(defaults).then(() => {
    console.log('done')
});
