
Example of running, generating the instance level metadata and bulkdata files:

> node bin/mkdicomwebinstances ../../../dagcom-test-data/dicom/ClearCanvas/CTStudy/1.2.840.113619.2.30.1.1762295590.1623.978668950.180.dcm 

# Generating Full Study Metadata
The following example generates a full DICOMweb structure required for OHIF.  This is done in three phases, one of which is performed in memory:
1. Generate the bulkdata and deduplicated instance data (including frames)
2. Combine the deduplicated instance data into lists grouped by study (done in-memory along with #1)
3. For all updated studies, read the deduplicated list data and write that out as series metadata, plus study/series/instance queries
4.  Build and add an OHIF server to the files
5. Serve up the DICOMweb files on port 5000

> node bin/mkdicomwebinstances -e /dicom/2-skull-ct
> node bin/mkdicomwebstudies
> cd /src/Viewers
> APP_CONFIG=config/local_static.js yarn build
> cp -R platform/viewer/dist/* ~/dicomweb
> cd ~/dicomweb
> npx http-server -p 5000 -g --cors
> firefox http://localhost:5000

# Documentation
See [Archive Format](docs/archive-format.md) for details on the archive format.

See [Design](docs/design.md) for details on the design.