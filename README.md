# dicomp10-to-dicomweb-js

Status: Alpha - in development (as of Oct 25, 2021)

The scope of this project is to convert DICOM P10 into a format into a DICOMweb compatible format - specifically JSON metadata, frames and bulkdata.  This library will enable the following:
* Building of DICOMweb compliant services
  * Ability to stream the data for "on the fly" use cases
* Ability to pregenerate DICOMweb responses and store them so they can be served up with a standard HTTP server to implement a subset of DICOMweb WADO-RS, specifically:
  * Retrieve instance metadata 
  * Retrieve frames in an instance
  * Retrieve bulk data
* To explore an alternative archive format that is web friendly (no need for a DICOM parser)
  * Should be able to recreate DICOM P10 file from this data (semantic equivalence or possibly bit for bit equivalent)
  * Will make updates more efficient (e.g. updating patient name just requires updating metadata)
  * More efficient image access (no need to scan through DICOM P10 to access frames, or store the offsets of each frame separately and seek to them) 

The scope of this library is limited to:
* Taking as input a single sop instance - it will not directly support series or study metadata generation
* Generating the minimum output in DICOMweb format that can be used to rebuild the sop instance in DICOM P10 format
  * No support for image rendering, transcoding, etc - those can be implemented on top of this library

View the [design rationale](docs/design.md) for more information on the scope

View [frequently asked questions](docs/faq.md)

View [specification](docs/spec.md)

## Pre-requisites

* NodeJS (v14.18.1 used but earlier/later versions should also)
* NPM

## Running Unit Tests

> npm run test

A visual studio code build task is also included so you can run it from there with "Terminal->Run Build Task" (Shift+Command+B)

## Running the CLI

See [dicomp10todicomweb example](examples/dicomp10todicomweb/README.md)

## TODO (Looking for help here!!)

* Create docker container to encapsulate build environment
* Create test data (DICOM P10 and expected DICOMweb results) - Jordan working on this
* Document API
* Create CI + Publish to NPM
* Fix Bugs
    * Get bulkdata refs written properly
    * Get PN written properly
    * Get multi-valued values written properly
* Enhance cli
    * Add support for directory as input
    * Add support for specifying bulkDataMinSize
    * Add support for specifying recursive directory search on input
    * Add support for wrapping bulkdata and image frames with multi-part mime header
    * Add support for gzip output
    * Add support for writing out DICOM P10 file
* Enhance library
    * Write out "info" file
        * P10 Header
        * Data needed to recreate original P10 instance
    * Add support for providing a data dictionary for non explicit images
* Create DICOMweb -> DICOM P10 tool
