#!/usr/bin/env node

import DicomWebServer from '../src/webserver/index.mjs'

// TODO - load params from file, or default to local file instance if not available
const params = {
    loadPaths: {
        ..
    }
};

const server = DicomWebServer();

server.addDicomWeb('/users/wayfa/dicomweb');
server.addDicomWeb('/src/Viewers/testdata', {path: '/testdata'});
server.addClient('/src/Viewers/platform/viewer/dist')

server.listen();
