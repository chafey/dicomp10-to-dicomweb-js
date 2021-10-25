# dicomp10-to-dicomweb-js
Code to convert from a DICOM P10 bitstream to dicomweb format (json metadata + frames + bulkdata)

The goal of this project is to convert DICOM P10 into DICOMweb format in a lossless manner.  This would enable the following:
* A web friendly archive format (no need for a DICOM Parser!)
* Recreation of DICOM P10
* Ability to stream the archive format out via HTTP directly and be compatible with a subset of DICOMweb WADO-RS
* More effecient metadata updates (e.g. patient name)
* More efficient image access

View the [specification](docs/spec.md)

