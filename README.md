# dicomp10-to-dicomweb-js

Status: Beta - in development (as of Oct 25, 2021)

The scope of this project is to convert DICOM P10 into a format into a DICOMweb compatible format - specifically JSON metadata, frames and bulkdata.  This library will enable the following:
* Building of DICOMweb compliant services
  * Ability to stream the data for "on the fly" use cases
* Ability to pregenerate DICOMweb responses and store them so they can be served up with a standard HTTP server to implement a subset of DICOMweb WADO-RS, specifically:
  * Retrieve instance metadata 
  * Retrieve series level metadata
  * Retrieve frames in an instance
  * Retrieve bulk data
  * Retrieve study, series or instance query
* To explore an alternative archive format that is web friendly (no need for a DICOM parser)
  * Should be able to recreate DICOM P10 file from this data (semantic equivalence or possibly bit for bit equivalent)
  * Will make updates more efficient (e.g. updating patient name just requires updating metadata)
  * More efficient image access (no need to scan through DICOM P10 to access frames, or store the offsets of each frame separately and seek to them) 

The scope of this library is limited to:
* Taking one or more DICOM files as input, writing Bulkdata and Pixeldata
* Creating either deduplicated representations or instance level metadata
* Combining deduplicated representations into sets of deduplicated representations
* Using the deduplicated representations to generate study/series/instance query results and series metadata

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

### To create a full DICOMweb output structure
Run the tool:
```
mkdicomweb <directoryOfP10Files>
```

### To run separated stages
The mkdicomweb tool runs the three stages all together, on just the studies references.  This can instead be done on separate files by running:
```
mkdicomwebdeduplicated <directoryOfP10Files>
mkdicomwebdeduplicatedgroup
mkdicomwebstudy
```
which creates a full study directory.  The first stage writes to ~/dicomweb/instances/<studyUID>/ data about each instance as it is read in.  The second stage then groups these files for more efficient compression into the ~/dicomweb/deduplicated/<studyUID>/   The last stage then creates the actual DICOMweb files.

There is currently no notification of what studies have been updated between stages.  The intent is to write notifications to ~/dicomweb/notifications/<studyUID> of what operations need to be applied/updated.

### To Service Instances up
```
cd ~/dicomweb
npx http-server -p 5000 -g --cors
```

The -g option serves up compressed files ending in .gz as compressed http streams.

### To Create DICOM part 10 from DICOMweb files
TODO

Run the tool mkdicomwebpart10 on the studyUID, and optionally on the series/instance UID's of interest to generate a local set of part 10 files.

### To Update DICOM Metadata
TODO

Run the tool 
```
mkdicomwebupdate -<delete/anonymize/patient/study/series/instance> <studyInstanceUID> (tag=newValue)* 
```
to delete the given item or to update the specified attribute contained in the given level.  Multiple mkdicomwebupdate commands may be run to perform updates on different attribute sets, or they may be grouped into a single file for bulk application.

## TODO (Looking for help here!!)

* Create docker container to encapsulate build environment
* Create test data (DICOM P10 and expected DICOMweb results) - Jordan working on this
* Document API
* Create CI + Publish to NPM
* Fix Bugs
    * Get bulkdata refs written properly
* Enhance cli
    * Add support for specifying bulkDataMinSize
    * Add support for writing out DICOM P10 file
* Enhance library
    * Write out "info" file
        * P10 Header
        * Data needed to recreate original P10 instance
* Create DICOMweb -> DICOM P10 tool
