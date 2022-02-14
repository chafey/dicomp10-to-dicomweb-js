import StaticWado from '../src/index.js'
import assert from "must"
import fs from 'fs'
import { deleteDir } from '../src/utils/index.js'
import { exec, execSync } from "child_process"

const outputDir = 'build/dicomweb'
const junoDir = `${outputDir}/studies/1.2.840.113619.2.5.1762583153.215519.978957063.78`
const junoSeriesDir = `${junoDir}/series/1.2.840.113619.2.5.1762583153.215519.978957063.121`
const junoInstancesDir = `${junoSeriesDir}/instances/1.2.840.113619.2.5.1762583153.215519.978957063.122`

const junoStudiesFile = `${junoDir}/index.json.gz`
const junoSeriesFile = `${junoDir}/series/index.json.gz`
const junoInstancesFile = `${junoSeriesDir}/instances/index.json.gz`
const junoFramesFile = `${junoInstancesDir}/frames/1`

describe('index', async() => {

    const processes = {};

    const importer = new StaticWado({
        isStudyData: true,
        isGroup: true,
    });

    before(async() => {
        deleteDir(outputDir, true)
        fs.mkdirSync(outputDir, {recursive: true})
  
        assert(fs.existsSync(outputDir)).must.be.true;

        console.log('Created directory', outputDir, fs.existsSync(outputDir));
    })

    const createJuno = () => {
        if( processes.createJuno ) return;
        execSync(`node bin/mkdicomweb.js -o build/dicomweb testdata/dcm/MisterMr/1.2.840.113619.2.5.1762583153.215519.978957063.122`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
        processes.createJuno = true;
    }

    it('basic exists test', async () => {
        createJuno();
        
        assert(fs.existsSync(junoDir)).must.be.true;
        assert(fs.existsSync(junoStudiesFile)).must.be.true;
        assert(fs.existsSync(junoSeriesFile)).must.be.true;
        assert(fs.existsSync(junoInstancesFile)).must.be.true;
        assert(fs.existsSync(junoFramesFile)).must.be.true;

    })
})