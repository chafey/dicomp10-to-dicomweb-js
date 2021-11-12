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
Install the CLI with either npm install -g .  or npm install -g dicomp10-to-dicomweb

### To create instances
Run the tool:
```
mkdicomwebinstances <directoryOfP10Files>
```

TODO: There is a -d option to this which writes the instances out in deduplicated (single instance) format 
instead of as metadata files, and a -g option to write deduplicated group files.  
This option is the way it would be handled for a lambda function operating on a single file at a time.

### To create a full DICOMweb output structure
Run the tool:
```
mkdicomweb <directoryOfP10Files>
```

### To run deduplicated and deduplicatedGroup
TODO: Two more tools are planned, mkdicomwebgroupdeduplicated and mkdicomwebfromdeduplicated,
to make the grouped deduplicated files, and then to make the full metadata files
from the deduplicated group files.  These perform directory scans to find updated deduplicated
files to test against, but enable full update/round trip setup.

### To Create DICOM part 10 from DICOMweb files
TODO

Run the tool mkdicomwebpart10 on the studyUID, and optionally on the series/instance UID's of interest to generate a local set of part 10 files.

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
    * Add support for specifying bulkDataMinSize
    * Add support for writing out DICOM P10 file
* Enhance library
    * Write out "info" file
        * P10 Header
        * Data needed to recreate original P10 instance
    * Add support for providing a data dictionary for non explicit images
* Create DICOMweb -> DICOM P10 tool
