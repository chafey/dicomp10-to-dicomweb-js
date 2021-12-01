const objectHash = require('object-hash');
const Tags = require('./Tags');

const {PatientID, PatientName, IssuerOfPatientID} = Tags;
const {StudyDescription, AccessionNumber, StudyInstanceUID} = Tags;
const {SeriesDescription, SeriesNumber, SeriesInstanceUID} = Tags;

const {DeduppedCreator, DeduppedTag, DeduppedHash, DeduppedRef, DeduppedType } = Tags;

const PatientQuery = [PatientID, PatientName, IssuerOfPatientID];
const StudyQuery = [StudyDescription, AccessionNumber, StudyInstanceUID];
const PatientStudyQuery = [...PatientID, ...StudyQuery];
// The difference between the extracts and the query is that the query contains the parent query values
// TODO - make it into a self-cpontained object that can generate either
const SeriesExtract = [SeriesDescription, SeriesNumber, SeriesInstanceUID,
    Tags.Modality, 
  ];
const SeriesQuery = [StudyInstanceUID,...SeriesExtract];

const TagSets = {
    PatientQuery, StudyQuery, PatientStudyQuery, SeriesQuery, SeriesExtract,

    extract: (data, type, tagSet, options) => {
        const ret = {};
        const {remove,hash} = options || {hash:true};
        tagSet.forEach( tag => {
            const value = data[tag];
            if( value ) {
                ret[tag] = value;
                if( remove ) delete data[tag];
            }
        });
        const hashValue = objectHash(ret);
        if( !ret[DeduppedHash] ) {
            ret[DeduppedTag] = {vr: 'CS', Value:[DeduppedCreator]};
            ret[DeduppedHash] = {vr:'CS', Value:[hashValue]};
            ret[DeduppedType] = {vr:'CS', Value:[type]};
        }
        if( hash ) {
            if( !data[DeduppedRef] ) {
                data[DeduppedTag] = {vr: 'CS', Value:[DeduppedCreator]};
                data[DeduppedRef] = {vr:'CS', Value:[]};
            }
            data[DeduppedRef].Value.push(hashValue);
        }
        return ret;
    },
};

module.exports = TagSets;