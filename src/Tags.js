const Tags = {
    PatientID: '00100020', 
    PatientName: '00100010', 
    IssuerOfPatientID: '00100021',
    StudyDescription: '00081030', 
    AccessionNumber: '00080050', 
    StudyInstanceUID: '0020000d',
    SeriesDescription: '0008103e', 
    SeriesNumber: '00200011', 
    SeriesInstanceUID: '0020000e',
    SOPClassUID: '00080016',
    SOPInstanceUID: '00080018',

    DeduppedCreator: "dedupped",
    DeduppedTag: '00090010',
    // TODO - make this actually work as a real deduplicated object with different creators/lookups.
    DeduppedHash: '00091011',
    DeduppedRef: '00091010',

};

module.exports = Tags;