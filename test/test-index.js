const dicomp10todicomweb = require('../src/index')
const assert = require('assert')
const fs = require('fs')

describe('index', async() => {
    let dicomp10stream

    beforeEach(async() => {
        //dicomp10stream = fs.createReadStream('../dagcom-test-data/dicom/WG04/compsamples_refanddir/IMAGES/REF/CT1_UNC')
        dicomp10stream = fs.createReadStream('../dagcom-test-data/dicom/WG04/compsamples_j2k/IMAGES/J2KR/CT1_J2KR')
    })

    it('exports', async () => {
        // Arrange

        // Act

        // Assert
        assert.notStrictEqual(dicomp10todicomweb, undefined)
    })

    it('returns metadata object', async () => {
        // Arrange
        let metadataCalled =false
        const callback = {
            metadata: (metadata) => {metadataCalled = true;},// console.log(metadata)},
            bulkdata: (index, bulkData) => {console.log('bulkdata', index, 'length=', bulkData.length)},
            imageFrame: (index, imageFrame) => {console.log('imageFrame', index, 'length=', imageFrame.length)}
        }
        const options = {
            maximumInlineDataLength: 128
        }

        // Act
        await dicomp10todicomweb(dicomp10stream, callback, options)

        // Assert
        assert.equal(metadataCalled, true)
    })
})