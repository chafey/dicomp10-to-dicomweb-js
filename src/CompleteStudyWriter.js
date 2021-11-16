const TagLists = require('./TagLists');
const JSONWriter = require('./JSONWriter');
const path = require('path');
const Tags = require('./Tags');
const JSONReader = require('./JSONReader');

/**
 * CompleteStudyWriter takes the deduplicated data values, all loaded into the study parameter,
 * and writes it out as study, series and instance queries, as well as series level metadata.
 */
const CompleteStudyWriter = options => {
    return async function () {
        if (!this.id) return;
        const { studyPath } = this.id;
        // Can set this to empty to force read
        const anInstance = await recombine(this, 0);
        console.log('Writing complete study data to', studyPath);

        const series = {};
        for (let i = 0; i < this.deduplicatedInstances.length; i++) {
            const seriesInstance = await recombine(this, i);
            const seriesInstanceUid = getSeriesInstanceUid(seriesInstance);
            if (!seriesInstanceUid) {
                console.log('Cant get seriesUid from', Tags.SeriesInstanceUID, seriesInstance);
                continue;
            }
            if (!series[seriesInstanceUid]) {
                const seriesQuery = TagLists.extract(seriesInstance, 'series', TagLists.SeriesQuery);
                const seriesPath = path.join(studyPath, 'series', seriesInstanceUid);
                series[seriesInstanceUid] = {
                    seriesPath,
                    seriesQuery,
                    instances: [],
                    instancesQuery: [],
                };
            }
            series[seriesInstanceUid].instances.push(seriesInstance);
            series[seriesInstanceUid].instancesQuery.push(TagLists.extract(seriesInstance,
                'instance', TagLists.InstanceQuery));
            // TODO - add instanceQuery path too
        }

        const seriesList = [];
        const modalitiesInStudy = [];
        let numberOfInstances = 0;
        let numberOfSeries = 0;
        for (const seriesUid of Object.keys(series)) {
            const singleSeries = series[seriesUid];
            const { seriesQuery, seriesPath, instances, instancesQuery } = singleSeries;
            seriesQuery[Tags.NumberOfSeriesRelatedInstances] = { vr: 'IS', Value: [instances.length] };
            numberOfInstances += instances.length;
            numberOfSeries++;
            seriesList.push(seriesQuery);
            const modality = seriesQuery[Tags.Modality].Value[0];
            if (modalitiesInStudy.indexOf(modality) == -1) modalitiesInStudy.push(modality);
            await JSONWriter(seriesPath, 'metadata', instances);
            await JSONWriter(seriesPath, 'series', [seriesQuery]);
            await JSONWriter(seriesPath, 'instances', instancesQuery)
        }

        await JSONWriter(studyPath, 'series', seriesList);

        const studyQuery = TagLists.extract(anInstance, 'study', TagLists.PatientStudyQuery);
        studyQuery[Tags.ModalitiesInStudy] = { Value: modalitiesInStudy, vr: 'CS' };
        studyQuery[Tags.NumberOfStudyRelatedInstances] = { Value: [numberOfInstances], vr: 'IS' };
        studyQuery[Tags.NumberOfStudyRelatedSeries] = { Value: [numberOfSeries], vr: 'IS' };
        await JSONWriter(studyPath, 'studies', [studyQuery]);

        if (!this.allStudies) this.allStudies = [];
        const studyUID = studyQuery[Tags.StudyInstanceUID].Value[0];
        const studyIndex = this.allStudies.findIndex(item => item[Tags.StudyInstanceUID].Value[0] == studyUID);
        if (studyIndex == -1) {
            this.allStudies.push(studyQuery);
        } else {
            this.allStudies[studyIndex] = studyQuery;
        }
        this.allStudies[studyIndex] = studyQuery;
        delete this.deduplicatedInstances;
        delete this.extractData;
        delete this.id;
    };
}

const getSeriesInstanceUid = (seriesInstance) => seriesInstance[Tags.SeriesInstanceUID] && seriesInstance[Tags.SeriesInstanceUID].Value[0];

/** Create a full study instance data from a partial one
 * TODO - implement this fully, for now it is just partial.
 */
const recombine = async (study, index) => {
    const deduplicated = study.deduplicatedInstances[index];
    const refs = deduplicated[Tags.DeduppedRef];
    if (!refs) {
        console.log('No refs for', deduplicated);
        return deduplicated;
    }
    const ret = Object.assign({}, deduplicated);
    for (const hashKey of refs.Value) {
        let item = study.extractData[hashKey];
        if (!item) {
            item = await JSONReader.readHashData(study.id.studyPath, hashKey);
            if (!item) {
                continue;
            }
            study.extractData[hashKey] = item;
        }
        Object.assign(ret, item);
    }
    return ret;
}

module.exports = CompleteStudyWriter;