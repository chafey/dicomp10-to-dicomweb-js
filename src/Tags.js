const Tags = {
    // Raw tags have the x before them, not parsed yet
    RawMinTag: 'x00000000',
    RawFirstBodyTag: 'x00080000',
    RawTransferSyntaxUID: 'x00020010',

    PatientID: '00100020', 
    PatientName: '00100010', 
    IssuerOfPatientID: '00100021',
    StudyDate: '00080020',
    StudyTime: '00080030',
    SeriesDate: '00080021',
    SeriesTime: '00080031',
    StudyDescription: '00081030', 
    AccessionNumber: '00080050', 
    StudyInstanceUID: '0020000D',
    SeriesDescription: '0008103E', 
    SeriesNumber: '00200011', 
    SeriesInstanceUID: '0020000E',
    SOPClassUID: '00080016',
    SOPInstanceUID: '00080018',
    InstanceNumber: '00200013',
    Modality: "00080060",
    ModalitiesInStudy: "00080061",
    NumberOfStudyRelatedInstances: "00201208",
    NumberOfStudyRelatedSeries: "00201206",
    NumberOfSeriesRelatedInstances: "00201209",
    TransferSyntaxUID: '00020010',
    AvailableTransferSyntaxUID: '00083002',

    // TODO - make this actually work as a real deduplicated object with different creators/lookups.
    DeduppedCreator: "dedupped",
    // Creator tag value
    DeduppedTag: '00090010',

    // The references to extract data included in this object, 1..n values
    DeduppedRef: '00091010',

    // The hash value of THIS object
    DeduppedHash: '00091011',
    
    // Type of hash instance
    DeduppedType: '00091012',

};


module.exports = Tags;