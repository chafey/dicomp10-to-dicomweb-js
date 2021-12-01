const TagLists = require('./TagLists');
const JSONWriter = require('./JSONWriter');
const path = require('path');
const Tags = require('./Tags');
const { studyInstanceUid } = require('./DeduplicateWriter');

/**
 * CompleteStudyWriter takes the deduplicated data values, all loaded into the study parameter,
 * and writes it out as study, series and instance queries, as well as series level metadata.
 */
async function CompleteStudyWriter() {
    if( !this.id ) return;
    const {studyPath} = this.id;
    const anInstance = recombine(this,0);
    console.log('Writing complete study data to', studyPath);
    
    const series = {};
    for(let i=0; i<this.deduplicatedInstances.length; i++) {
        const seriesInstance = recombine(this,i);
        const seriesInstanceUid = getSeriesInstanceUid(seriesInstance);
        if( !seriesInstanceUid ) {
            console.log('Cant get seriesUid from',Tags.SeriesInstanceUID, seriesInstance );
            continue;
        }
        if( !series[seriesInstanceUid] ) {
            const seriesQuery = TagLists.extract(seriesInstance, 'series', TagLists.SeriesQuery);
            const seriesPath = path.join(studyPath, 'series', seriesInstanceUid);
            series[seriesInstanceUid] = {
                seriesPath,
                seriesQuery,
                instances: [],
            };
        }
        series[seriesInstanceUid].instances.push(seriesInstance);
        // TODO - add instanceQuery path too
    }

    const seriesList = [];
    const modalitiesInStudy = [];
    let numberOfInstances = 0;
    let numberOfSeries = 0;
    for(const seriesUid of Object.keys(series) ) {
        const singleSeries = series[seriesUid];
        const {seriesQuery,seriesPath, instances} = singleSeries;
        seriesQuery[Tags.NumberOfSeriesRelatedInstances] = {vr:'IS', Value: [instances.length]};
        numberOfInstances += instances.length;
        numberOfSeries++;
        seriesList.push(seriesQuery);
        const modality = seriesQuery[Tags.Modality].Value[0];
        if( modalitiesInStudy.indexOf(modality)==-1 ) modalitiesInStudy.push(modality);
        await JSONWriter(seriesPath, 'metadata',instances);
        await JSONWriter(seriesPath, 'series', [seriesQuery]);
    }

    await JSONWriter(studyPath,'series',seriesList);

    const studyQuery = TagLists.extract(anInstance,'study', TagLists.PatientStudyQuery);
    studyQuery[Tags.ModalitiesInStudy] = {Value: modalitiesInStudy, vr: 'CS'};
    studyQuery[Tags.NumberOfStudyRelatedInstances] = {Value: [numberOfInstances], vr: 'IS'};
    studyQuery[Tags.NumberOfStudyRelatedSeries] = {Value: [numberOfSeries], vr: 'IS'};
    await JSONWriter(studyPath,'studies',[studyQuery]);

    if( !this.allStudies ) this.allStudies = [];
    const studyUID = studyQuery[Tags.StudyInstanceUID].Value[0];
    const studyIndex = this.allStudies.findIndex(item=> item[Tags.StudyInstanceUID].Value[0]==studyUID);
    if( studyIndex==-1 ) {
        this.allStudies.push(studyQuery);    
    } else {
        this.allStudies[studyIndex] = studyQuery;
    }
    this.allStudies[studyIndex] = studyQuery;
    delete this.deduplicatedInstances;
    delete this.extractData;
    delete this.id;
};

const getSeriesInstanceUid = (seriesInstance) => seriesInstance[Tags.SeriesInstanceUID] && seriesInstance[Tags.SeriesInstanceUID].Value[0];

/** Create a full study instance data from a partial one
 * TODO - implement this fully, for now it is just partial.
 */
const recombine = (study,index) => {
    // TODO - generate this from a combination of extracted data later
    return study.deduplicatedInstances[index];
}

module.exports = CompleteStudyWriter;