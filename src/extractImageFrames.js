const getNumberOfFrames = require('./getNumberOfFrames')
const getUncompressedImageFrame = require('./getUncompressedImageFrame')
const getEncapsulatedImageFrame = require('./getEncapsulatedImageFrame')
 
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

const extractImageFrames = async (dataSet, attr, vr, callback, options) => {
    const numberOfFrames = getNumberOfFrames(dataSet)
    const framesAreFragmented = areFramesAreFragmented(attr, numberOfFrames)
    const uncompressedFrameSize = getFrameSize(dataSet)

    let BulkDataURI;
    for(let frameIndex = 0; frameIndex < numberOfFrames; frameIndex++) {
        if(attr.encapsulatedPixelData) {
            const compressedImageFrame = getEncapsulatedImageFrame(dataSet, attr, frameIndex, framesAreFragmented)
            BulkDataURI = callback.imageFrame(compressedImageFrame, {dataSet})
        } else {
            const imageFrame = getUncompressedImageFrame(dataSet, attr, frameIndex, uncompressedFrameSize)
            BulkDataURI = callback.imageFrame(imageFrame, {dataSet})
        }
    }
    return BulkDataURI
}

module.exports = extractImageFrames