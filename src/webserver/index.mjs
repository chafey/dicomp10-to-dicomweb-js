import express from 'express'

// Serve up the web files
// Configuration is broken up into several parts:
// 1. Web Service Configuration - port number, path, localhost only or all hosts or specified
// 2. Client Service Configuration - one or more static directories containing static client files
// 3. DICOMweb Service Configuration - a directory or root path to serve, plus one or more dynamic component extensions
// These can all be repeated.

const DicomWebServer = (params) => {
    const app = express();

    app.params = params || {};

    const superListen = app.listen;
    app.listen = (port) => {
        if( port ) superListen.call(app,port);
        superListen.call(app,app.params.port | 5000);
    }

    app.get('/', function (req, res) {
        res.send('Hello World')
      })
    
    return app;
}

export default DicomWebServer;