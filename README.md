# dicomp10-to-dicomweb-js
Code to convert from a DICOM P10 bitstream to dicomweb format (json metadata + frames + bulkdata)

The goal of this project is to convert DICOM P10 into DICOMweb format in a lossless manner.  This would enable the following:
* A web friendly archive format (no need for a DICOM Parser!)
* Recreation of DICOM P10
* Ability to stream the archive format out via HTTP directly and be compatible with a subset of DICOMweb WADO-RS
* More effecient metadata updates (e.g. patient name)
* More efficient image access

View the [specification](docs/spec.md)

## Pre-requisites

* NodeJS (v14.18.1 used but earlier/later versions should also)
* NPM

## TODO

* Create docker container to encapsulate build environment
* Create test data (DICOM P10 and expected DICOMweb results) - Jordan working on this
* Document API
* Create CI + Publish to NPM
* Fix Bugs
    * Get bulkdata refs written properly
    * Get PN written properly
    * Get array of binary numbers written properly
* Enhance cli
    * Add support for directory as input
    * Add support for specifying bulkDataMinSize
    * Add support for specifying recursive directory search on input
    * Add support for wrapping bulkdata and image frames with multi-part mime header
    * Add support for gzip output
* Enhance library
    * Write out "info" file
        * P10 Header
        * Data needed to recreate original P10 instance
* Create DICOMweb -> DICOM P10 tool
