const main = require('./mkdicomweb');

// Only run the main when the command line is the mkdicomwebdeduplicatedgroup one
if( main.commandName('mkdicomwebdeduplicatedgroup') ) {
    const defaults = {
        isStudyData: false,
        scanStudies: 'deduplicatedInstancesRoot',
        isGroup: true,
        removeDeduplicatedInstances: true,
        helpShort: 'mkdicomwebdeduplicatedgroup <optional-study-uid-list>',
        helpLong: 'Makes sets of deduplicated instances out of the single instance deduplicated data.\n'+
          'Scans the dicomweb/instances directory to find data, then deletes it by default.',
    };
    main(defaults).then(()=> {
        console.log('done')
    });
}