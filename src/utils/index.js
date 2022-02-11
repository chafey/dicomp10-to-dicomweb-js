// Various utilities for converting DICOM files to DICOMweb
const os = require('os')
const path = require('path')
const homedir = os.homedir();
const deleteDir = require('./deleteDir')

const handleHomeRelative = (dirName) => (dirName[0] == '~' ? (path.join(homedir, dirName.substring(1))) : dirName);

module.exports = {
    handleHomeRelative,
    homedir,
    deleteDir,
}