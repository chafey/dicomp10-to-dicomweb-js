const objectHash = require('object-hash');
const Tags = require('./Tags');

const {PatientID, PatientName, IssuerOfPatientID} = Tags;
const {StudyDescription, AccessionNumber, StudyInstanceUID} = Tags;
const {SeriesDescription, SeriesNumber, SeriesInstanceUID} = Tags;

const {DeduppedCreator, DeduppedTag, DeduppedHash, DeduppedRef  } = Tags;

const PatientQuery = [PatientID, PatientName, IssuerOfPatientID];
const StudyQuery = [StudyDescription, AccessionNumber, StudyInstanceUID];
const PatientStudyQuery = [...PatientID, ...StudyQuery];
const SeriesQuery = [SeriesDescription, SeriesNumber, SeriesInstanceUID];

const TagSets = {
    PatientQuery, StudyQuery, PatientStudyQuery, SeriesQuery,

    extract: (data, tagSet, options) => {
        const ret = {};
        const {remove,hash} = options || {};
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