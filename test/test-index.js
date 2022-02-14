const StaticWado = require('../src/index')
const assert = require('assert')
const fs = require('fs')

describe('index', async() => {
    let dicomp10stream

    const importer = new StaticWado({
        isStudyData: true,
        isGroup: true,
    });

    beforeEach(async() => {
        dicomp10stream = fs.createReadStream('testdata/dcm/MisterMr/1.2.840.113619.2.5.1762583153.215519.978957063.101');
    })

    it('exports', async () => {
        assert.notStrictEqual(importer, undefined)
    })

    // TODO - add integration tests
})