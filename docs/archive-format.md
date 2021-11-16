# Deduplicated Archive Format Description
Describes the format of the deduplicated archive structure.  This is intended to allow for interoperability of systems producing or consuming such data.

## Core File Structure
The basic file structure is related to the structure for DICOMweb, with a few differences relating to storage of the data on the file system versus as web queries, plus the addition of deduplicated data.  There are two different trees of data on the file systems.  The current version is the version required for a standard DICOMweb client to be able to access the data efficiently.  The deduplicated tree contains a much leaner set of data, used to create the current version.

### Current Version
There are a number of "current" version query and metadata files.  These files are an eventually updated version of the status of the study.  They are all located in the <DICOMWebPath>/studies/<StudyInstanceUID> directory, under the following structure.  Files ending in .gz are gzipped versions that would be served without the .gz extension, but in a file system are identified as containing the .gz extension.  All queries implicitly have 'includeField=all'.

It is not necessary to have the current version and deduplicated instances located on the same file system or location.  Indeed, it may be optimal to store each one separately to allow cleaning the current version system, and dynamic creation of the current version based on the deduplicated version.

* studies.gz  containing the studies query  studies?StudyInstanceUID=<StudyInstanceUID>
* series.gz   containing the series query   studies/<StudyInstanceUID>/series
* deduplicated.gz  containing the current study level deduplicated data (for all instances)
* series/<SeriesInstanceUID>/metadata.gz  containing the metadata for the series
* series/<SeriesInstanceUID>/instances.gz containing the instances query for this series
* series/<SeriesInstanceUID>/thumbnail containing the series thumbnail in JPEG
* series/<SeriesInstanceUID>/instances/<SopInstanceUID>/frames/1..n for pixel data encoded in separate parts (even if n=1)
* series/<SeriesInstanceUID>/instances/<SopInstanceUID>/pixeldata   for pixel data encoded in a single part (eg video)
* series/<SeriesInstanceUID>/instances/<SopInstanceUID>/thumbnail containing a JPEG encoded image
* bulkdata/hash0-3/hash3-5/hash5- (.json/.raw) containing bulkdata files, hashed in some mechanism
** hash0-3 is 'hash-string'.substring(0,3) etc
** current hash is SHA1 of the contents, but the ordering etc isn't well defined

### Creating Current Version from Deduplicated Data
To create the current version from the deduplicated data, all the deduplicated files are read for a given study, and then are recombined with the hash data to generate the current metadata for each instance.  These instance files are then used to generate series metadata, study query files etc.  

The referenced images are copied from the bulkdata hash directory to the frames and/or pixeldata directories, and thumbnails are written.

The hash value of each object is recorded in the object itself as it is written.  This allows comparing the generated value with the hash value, and allows for a stability check to see if there are any concurrency issues.  This check needs to be done as a second phase after writing the files initially, and after it is known that any synchronization issues cross-cluster have been resolved.  The basic process is after receiving any data or update to a study, initiate the following:

1. Read the deduplicated files
2. For each instance, add the data to the appropriate object (study query, series query, series metadata, frame object etc)
3. If the hash data is the same as the value on disk, then skip writing the given output
4. If any file was written, then wait some length of time and reset at #1

Note how this is cluster safe as long as the time in #4 is sufficiently long for deduplicated file data to 'settle'.  If the cluster is known to be split, then this time should be extended until the cluster has rejoined and the algorithm can be run again.

## Deduplicated Data
The deduplicated data is the main archive format for the deduplicated instances.  It attempts to be able to recover all versions of the data, and store all the information required to generate the DICOMweb format in an efficient manner.
The primary paths for the deduplicated data are:
* studies/<StudyInstanceUID>/bulkdata/hash0-3/hash3-5/hash5-  (.json/.raw/.jp2/.jls etc)
* studies/<StudyInstanceUID>/deduplicated/hash.gz containing GZIP deduplicated lists
* studies/<StudyInstanceUID>/deduplicated/isntances/sop-uid.gz containing GZIP deduplicated instance data


### Deduplicated Private Tags
The private dictionary for the deduplicated tags is below.  The tag values are shown as resolved values.
```
    DeduppedCreator: "dedupped"
    DeduppedTag: (0009,0010)
    DeduppedRef: (0009,1010)
    DeduppedHash: (0009,1011)
    DeduppedType: (0009,1012)
    DeduppedDelete: (0009,1013)
    DeduppedReplace: (0009,1014)
    ReplaceDeduplicatedFile: (0009,1015)
```

### JSON BulkData format
The JSON BulkData format is an enhancement of a standard DICOM JSON object, with the additional fields:
* DeduppedHash is a hash value of THIS object, without this value being used in the hash
* DeduppedType contains a string value with the type of THIS object (eg series, study etc)
* DeduppedReplace contains one or more hash values for objects that this replaces.

Note that it may itself be a JSON Deduplicated instance.
If the bulkdata object is contained in the bulkdata path, then the path shall be:
`bulkdata/hash0-3/hash3-5/hash5- (.json/.raw)`
This path mapping allows going from a hash value to a bulkdata location.

### JSON Deduplicated format
The deduplicated format is a DICOM JSON object, with any number of tags removed and placed into JSON BulkData instances.  Those instances are referred to by hash value, in the following ways:
* DeduppedRef contains hash value strings
* Sequence elements MAY contain BulkDataURI, with a full path reference to the sequence bulkdata in the bulkdata path
* Sequence or Fragmented elements MAY contain a Fragments array, listing the hash value of each child value/element.
* If the Fragmented object is pixel data, then the hash value SHALL be that of the uncompressed pixel data
* If the Fragmented object is video data, then the hash value SHALL be that of the video stream
* If the DeduppedDelete tag is present, it indicates that this object is removed

### Deduplicated Instance Object
The deduplicated instance objects are listed in the `studies/<StudyInstanceUID>/deduplicated/instances` directory.  Each instance contains a single JSON deduplicated object, with referenced values contained in the bulkdata directory.  The contents of the JSON may be as little as a set of references to the relevant hash values, with all underlying data stored in the bulkdata, or can be as much as the full instance level metadata.  These files MAY be replaced with versions in the deduplicated top level directory.

#### Deduplicated Patient, Study, Series
At a minimum, the deduplicated instances SHALL remove three sets of data, corresponding to the patient, study and series level attributes, storing those in the bulkdata folder.

### Deduplicated List Objects
The `studies/<StudyInstanceUID>/deduplicated` directory contains one or more JSON objects, each containing a list of JSON Deduplicated objects and Deduplicated Instance Objects.  The study contains the SUM of all the files, treated as though they were concatenated one after another.  However, it is not necessary to read all files all the time.  Reading the latest file present, and then looking in the first object within the JSON list for the value ReplaceDeduplicatedFile.  Any files listed in the ReplaceDeduplicatedFile do not need to be read (and are only required for historical/older version updates).  There may be more than two files required to be read, being a combination of two or more concurrent changes.

The combination of all the top level (leaf) files, not referred to by any other deduplicated list file should be written out as the `studies/<StudyInstanceUID>/deduplicated.gz` file when creating a full metadata instance file.  

#### Removal of Deduplicated Objects
In order to preserve space constraints, it may be desirable to remove older deduplicated files, either the instances ones or the top level values.  This is safe to do as long as:
* The deduplicated file is referenced in a newer deduplicated file which is fully committed/written
* The original data instances are not required to be available
* The deduplicated file being removed is not in use.  As a suggestion, deduplicated instance files can be immediately removed, while deduplicated list files should remain at least 24 hours

#### Combining Deduplicated List Objects
Two or deduplicated objects may be combined by referencing all the deduplicated objects the new object is being combined from.  The new deduplicated object should be written atomically.  It may or may not contain the DeduppedRef values depending on optimizations present.

## Study QC
Various types of study quality control, such as patient data updates, split, segment and delete are all possible on the deduplicated data.

### Patient and Study Updates
A patient or study update is performed by writing a new bulkdata Patient or Study record, and then writing a new deduplicated list, with the study or patient element updated inline, and with it having a `DeduppedReplace` listing the older hash values, and every location that value is referenced replaced with the new hash value.  

If the study instance UID is being updated, then the deduplicated record should contain a new Study Instance UID reference, and should be written in both the old and new study locations.  That allows automaticaly moving the old data to the new location.  This may need some additional consideration as to how to handle this appropriately.

### Instance Replace and Delete
Instance deletes are performed by writing a new instance record in the dedupped list, containing the original SOP Instance UID, and the `DeduppedReplace` or `DeduppedDelete` tag set.  

### Split/Segment
A split or segment operation is performed in the same way as the instance replace, with two records replacing the original data.  The first record is a delete one on the original items, while the second one is a DeduppedReplace object referencing the original object.
This operation requires copying the original frames/pixel data from the old location to the new one.

Also, and DICOM references to the old SOP instance UID should be replaced with new ones.

If the instance is being moved to a new study, then look at the study updates information.

## Concurrent Updates
The creation of the deduplicated instances or lists initially, plus the writing of BulkDataURI referenced items and frame data is thread safe across any number of sites, provided that a single DICOM instance containing different data is never sent at the same time.

QC operations done in parallel may result in conflicts which need to be resolved via human interaction.  However, it is at least possible to detect whether such operations are identical or can be automatically applied.

## Performance Considerations
There are a number of performance optimizations already present, or possible to use:
* Have the client use direct access to the latest dedupplicated.gz file, and don't store the remainder of the DICOMweb files.
* Store the metadata etc files in GZIP (this is required above)
* Use lazy generation of the DICOMweb instances - either based on about to view or on demand (optimizes space)
* Store deduplicated/instances on local/fast storage system, group at short interval (1 minute?)
* Cluster receive operations into many instances - since it is cluster thread safe, the receive can be done across many instances, some local to hospitals
* ZIP storage of bulkdata - one or more ZIP files can be written containing bulkdata.  These have to each be opened, but they are far more storage efficient than individual files.  This part is still being considered.

## Creation of DICOM Part 10
In the same way that the metadata and bulkdata files can be written, the deduplicated instances can be used backwards, reading all the bulkdata attributes when required and writing out the full DICOM part 10 instance data.  This results in fully updated part 10 files, and it should be possible to write these extremely quickly because large parts of the files
are simply streamed from bulkdata locations.