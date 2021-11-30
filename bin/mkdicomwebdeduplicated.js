const main = require('./mkdicomweb');

// Only run the main when the command line is the mkdicomweb one
const argName = process.argv[1];
if( argName && argName.indexOf('mkdicomwebdeduplicated.js')!=-1 ) {
    const defaults = {
        isStudyData: false,
        isGroup: false,
        isDeduplicate: true,
        helpShort: 'mkdicomwebdeduplicated <part-10-dicom-files-or-dirs>',
        helpLong: 'Makes deduplicated instance level files from a set of DICOM part 10 files.\n'+
          'Does not write sets of deduplicated files by default.',
    };
    main(defaults).then(()=> {
        console.log('done')
    });
}