# Specification

## Library

This library takes as input a DICOM P10 bitstream and produces bit streams for the following:
* Metadata - JavaScript Object
* Image Frames - binary data of each image frame in the stored transfer syntax 
* bulk data - any metadata tags that are longer than a certain size (default 128 bytes) 

Note - image frames and bulk data are not wrapped in multi-part mime 

### TODO

* Document API
* Figure out how to store the P10 header (e.g. transfer syntax uid)?
* Consider storing encoding details so original P10 can be recreated without any loss
  * undefined lengths
  * frame fragmentation
  * basic offset table
* Consider adding transformation capabilities
  * de-identification
  * strip out private data
* Consider generating rendered frames (check with Markus about this for path)

## CLI

Included is an example cli that uses this library takes converts a DICOM P10 file on disk to files on disk that match
the DICOMweb URI pattern.  These files can be served up using a standard HTTP server and will be DICOMweb compliant

Parameters:
* --input <path to DICOM P10 file or directory of DICOM P10 files>
* --output <path to store DICOMweb format>
* --bulkDataMinSize <size of attributes to generate as bulk data>
* --recursive - recursively scans directories for DICOM P10 files

The cli will generate files in the output directory like this:

```
<StudyInstanceUid>/series/<SeriesInstanceUid>/instances/<SOPInstanceUID>/metadata - Metadata in JSON format
<StudyInstanceUid>/series/<SeriesInstanceUid>/instances/<SOPInstanceUID>/frames/ - Image frames 1..N
<StudyInstanceUid>/series/<SeriesInstanceUid>/instances/<SOPInstanceUID>/bulkdata - Bulk data items 1..N
<StudyInstanceUid>/series/<SeriesInstanceUid>/instances/<SOPInstanceUID>/info - info about the conversion - P10 header, gzip encoding, length strategy, etc
```

Note - image frames and bulk data are wrapped with multi-part mime headers so they can be streamed directly using a simple HTTP server

TODO
* Add parameter to enable/disable multi-part mime wrapping?
* Add parameter to enable gzip compressing?
  * Would need to figure out how to remember this
