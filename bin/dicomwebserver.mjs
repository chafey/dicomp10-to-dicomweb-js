#!/usr/bin/env node

import DicomWebServer from '../src/webserver/index.mjs'

const server = DicomWebServer();

server.listen();