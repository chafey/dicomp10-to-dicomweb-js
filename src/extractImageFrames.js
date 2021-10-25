const getNumberOfFrames = require('./getNumberOfFrames')
const getUncompressedImageFrame = require('./getUncompressedImageFrame')

const areFramesAreFragmented = (attr, numberOfFrames) => {
    return attr.encapsulatedPixelData && numberOfFrames != attr.fragments.length
}

const getFrameSize = (dataSet) => {
    const rows = dataSet.uint16('x00280010')
    const columns = dataSet.uint16('x00280011')
    const samplesPerPixel = dataSet.uint16('x00280002')
    const bitsAllocated = dataSet.uint16('x00280100')
    return rows * columns * samplesPerPixel * bitsAllocated / 8
}

const extractImageFrames = (dataSet, attr, vr, dataSetGen, callback, options) => {
    const numberOfFrames = getNumberOfFrames(dataSet)

    const framesAreFragmented = areFramesAreFragmented(attr, numberOfFrames)
    //console.log('framesAreFragmented=', framesAreFragmented)

    const uncompressedFrameSize = getFrameSize(dataSet)
    //console.log('uncompressedFrameSize=', uncompressedFrameSize)

    for(let frame = 0; frame < numberOfFrames; frame++) {
        console.log('extracting frame ', frame)
        if(attr.encapsulatedPixelData) {
            //const compressedImageFrame = getEncapsulatedImageFrame(sopInstance.sourceInfo.uri, pixelData._fields, frame, framesAreFragmented)
            //const result = await decodeImageFrame(sopInstance.dataSet, compressedImageFrame)
            //return result
        } else {
            const imageFrame = getUncompressedImageFrame(dataSet, attr, frame, uncompressedFrameSize)
            callback.imageFrame(imageFrame)
        }
    }
}



module.exports = extractImageFrames