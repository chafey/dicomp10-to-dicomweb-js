const TagLists = require('./TagLists');
const JSONWriter = require('./JSONWriter');
const JSONReader = require('./JSONReader');
const path = require('path');
const Tags = require('./Tags');
const StudyData = require('./StudyData')


const getSeriesInstanceUid = (seriesInstance) => seriesInstance[Tags.SeriesInstanceUID] && seriesInstance[Tags.SeriesInstanceUID].Value[0];

/**
 * CompleteStudyWriter takes the deduplicated data values, all loaded into the study parameter,
 * and writes it out as various dataset types.  The options parameters define what types it gets
 * written out as.
 * The studyData object is then removed, so that a new one can be created if required.
 */
const CompleteStudyWriter = options => {
    const ret = async function () {
        const {studyData} = this;
        if (!studyData) return;
        const { studyPath } = studyData;
        
        if( !studyData.numberOfInstances ) {
            console.log('studyData.deduplicated is empty');
            delete this.studyData;
            return;
        }

        // TODO - also check if anything was updated here, but that is presumed positive for now
        if(options.isGroup ) {
            await JSONWriter(path.join(studyPath,'deduplicated'),'deduplicated',studyData.deduplicated);
        }

        if( !options.isStudyData ) {
            delete this.studyData;
            return;
        }

        // TODO - move this whole chunk into StudyData, let it decide what is required to write
        // Start by writing an updated deduplicated file
        console.log('Writing complete study data to', studyPath);
        await JSONWriter(studyPath,'deduplicated',studyData.deduplicated);
        
        const anInstance = await studyData.recombine(0);
        const series = {};

        for (let i = 0; i < studyData.numberOfInstances; i++) {
            const seriesInstance = await studyData.recombine(i);
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

        const allStudies = await JSONReader(options.directoryName, "studies.gz", []);
        const studyUID = studyQuery[Tags.StudyInstanceUID].Value[0];
        const studyIndex = allStudies.findIndex(item => item[Tags.StudyInstanceUID].Value[0] == studyUID);
        if (studyIndex == -1) {
            allStudies.push(studyQuery);
        } else {
            allStudies[studyIndex] = studyQuery;
        }
        JSONWriter(options.directoryName,"studies", allStudies);
        delete this.studyData;
    };

    /** 
     * Gets a current study data object, or completes the old one and generates a new one.
     * async call as it may need to store the current study data value.
     */
    ret.getCurrentStudyData = async (callback,id) => {
        let { studyData } = callback;
        const { studyInstanceUid } = id;
        
        if( studyData ) {
            if( studyData.studyInstanceUid==studyInstanceUid ) {
                return studyData;
            } else {
                await callback.completeStudy(studyData);
            }
        }
        console.log('StudyData=', StudyData);
        callback.studyData = new StudyData(id, options);
        await callback.studyData.init();
        return callback.studyData;
    }

    return ret;
}

module.exports = CompleteStudyWriter;