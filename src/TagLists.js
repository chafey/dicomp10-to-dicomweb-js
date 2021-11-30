const hashFactory = require('node-object-hash');
const hasher = hashFactory();
const Tags = require('./Tags');

const {PatientID, PatientName, IssuerOfPatientID} = Tags;
const {StudyDescription, AccessionNumber, StudyInstanceUID, StudyDate, StudyTime} = Tags;
const {SeriesDescription, SeriesNumber, SeriesInstanceUID, SeriesDate, SeriesTime} = Tags;

const {DeduppedCreator, DeduppedTag, DeduppedHash, DeduppedRef, DeduppedType } = Tags;

const PatientQuery = [PatientID, PatientName, IssuerOfPatientID];
const StudyQuery = [StudyDescription, AccessionNumber, StudyInstanceUID, StudyDate, StudyTime];
const PatientStudyQuery = [...PatientQuery, ...StudyQuery];
// The difference between the extracts and the query is that the query contains the parent query values
// TODO - make it into a self-cpontained object that can generate either
const SeriesExtract = [
    SeriesDescription, SeriesNumber, SeriesInstanceUID,
    Tags.Modality, SeriesDate, SeriesTime,
  ];
const SeriesQuery = [StudyInstanceUID,...SeriesExtract];

const InstanceQuery = [Tags.SOPInstanceUID, Tags.InstanceNumber, Tags.SeriesInstanceUID, Tags.StudyInstanceUID];

const addHash = (data,type) => {
    if( data[DeduppedHash] ) return data[DeduppedHash].Value[0];
    const hashValue = hasher.hash(data);
    if( !data[DeduppedHash] ) {
        data[DeduppedTag] = {vr: 'CS', Value:[DeduppedCreator]};
        data[DeduppedHash] = {vr:'CS', Value:[hashValue]};
        data[DeduppedType] = {vr:'CS', Value:[type]};
    }
    return hashValue;
}

const TagSets = {
    PatientQuery, StudyQuery, PatientStudyQuery, SeriesQuery, SeriesExtract, InstanceQuery,
    
    QueryExtract: { remove: false, hashRef: false},
    RemoveExtract: { remove: true, hashRef: true},

    extract: (data, type, tagSet, options) => {
        const ret = {};
        const {remove,hashRef} = options || {};
        tagSet.forEach( tag => {
            const value = data[tag];
            if( value ) {
                ret[tag] = value;
                if( remove ) delete data[tag];
            }
        });
        const hashValue = addHash(ret,type);
        if( hashRef ) {
            if( !data[DeduppedRef] ) {
                data[DeduppedTag] = {vr: 'CS', Value:[DeduppedCreator]};
                data[DeduppedRef] = {vr:'CS', Value:[]};
            }
            data[DeduppedRef].Value.push(hashValue);
        }
        return ret;
    },
    addHash,
};

module.exports = TagSets;