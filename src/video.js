/** Write raw video file */

const Tags = require("./Tags");
const WriteStream = require('./WriteStream');
const dicomParser = require('dicom-parser')

const MPEG2 = "mpg";
const H264 = "mp4";
const H265 = "h265";

const VIDEO_TYPES = {
    "1.2.840.10008.1.2.4.100": MPEG2,
    "1.2.840.10008.1.2.4.101": MPEG2,
    "1.2.840.10008.1.2.4.102": H264,
    "1.2.840.10008.1.2.4.103": H264,
    "1.2.840.10008.1.2.4.104": H264,
    "1.2.840.10008.1.2.4.105": H264,
    "1.2.840.10008.1.2.4.106": H264,
    "1.2.840.10008.1.2.4.107": H265,
    "1.2.840.10008.1.2.4.108": H265,
    // TODO - add the new multi-segment MPEG2 and H264 variants
}

const isVideo = dataSet => {
    const tsuid = dataSet.string(Tags.RawTransferSyntaxUID);
    const type = VIDEO_TYPES[tsuid];
    return type;
};

const getFragment = (frameIndex, dataSet) => {
    try {
        return dicomParser.readEncapsulatedPixelDataFromFragments(
            dataSet,
            dataSet.elements.x7fe00010,
            frameIndex
        );
    } catch (e) {
        return null;
    }
}

const CreateVideoWriter = options => {
    const writeVideo = async (id, dataSet) => {
        console.log(`Writing video  ${id.sopInstanceUid}`);
        const extension = VIDEO_TYPES[dataSet.string(Tags.RawTransferSyntaxUID)];
        const filename = `pixeldata.${extension}`;
        const writeStream = WriteStream(id.sopInstanceRootPath, filename, { mkdir: true });
        let length = 0;
        for (let i = 0; true; i++) {
            const blob = getFragment(i, dataSet);
            if (!blob) {
                await writeStream.close();
                // console.log(`Done video ${id.sopInstanceRootPath}\\${filename} of length ${length}`);
                return `series/${id.seriesInstanceUid}/instances/${id.sopInstanceUid}/pixeldata.${extension}?length=${length}&offset=0`;
            }
            length += blob.length;
            await writeStream.write(blob);
        }
    }
    return writeVideo;
};


module.exports = {
    isVideo, CreateVideoWriter,
}