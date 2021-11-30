const main = require('./mkdicomweb');

// Only run the main when the command line is the mkdicomweb one
const argName = process.argv[1];
if( argName && argName.indexOf('mkdicomwebinstances.js')!=-1 ) {
    const defaults = {
        isStudyData: false,
        isInstanceMetadata: true,
        clean: true,
        helpShort: 'mkdicomwebinstances <dicom-part-10-files-or-directories>',
        helpLong: 'Takes DICOM part 10 files and writes the bulkdata/instance metadata.',
    };
    main(defaults).then(()=> {
        console.log('done mkdicomwebinstances')
    });
}