import express from 'express'
import logger from 'morgan'


const qidoMap = (req,res,next) => {
    console.log('QIDO request', req.path, req.url);
    req.url = req.path + '/index.json.gz'
    res.setHeader('content-type', 'application/json');
    next();
};

const qidoMapPost = (req,res,next) => {
    console.log('QIDO request post', req.path);
    next()
};

const gzipHeaders = (res, path, stat) => {
  if (path.indexOf('.gz') !== -1) {
    res.setHeader('Content-Encoding', 'gzip')
  } else if (path.indexOf('.br') !== -1) {
    res.setHeader('Content-Encoding', 'br')
  }
};

const methods = {

    addDicomWeb: function(dir, params = {}) {
        const path = params.path || '/dicomweb';
        const router = express.Router();
        this.use(path,router);

        router.get('/studies', qidoMap);
        router.get('/studies/:studyUID/series',qidoMap);
        router.get('/studies/:studyUID/series/:seriesUID/instances',qidoMap);
        // Handle the QIDO queries
        router.use(express.static(dir, {
            index: 'index.json.gz',
            setHeaders: gzipHeaders,
            extensions: ['gz'],
            redirect: false,
        }));
    },

    addClient: function(dir, params = {}) {
        const path = params.path || '/';
        
        this.use(express.static(dir, {
            index: 'index.html',
            setHeaders: gzipHeaders,
            extensions: ['gz'],
            redirect: false,
        }))
    },
};

// Serve up the web files
// Configuration is broken up into several parts:
// 1. Web Service Configuration - port number, path, localhost only or all hosts or specified
// 2. Client Service Configuration - one or more static directories containing static client files
// 3. DICOMweb Service Configuration - a directory or root path to serve, plus one or more dynamic component extensions
// These can all be repeated.

const DicomWebServer = (params) => {
    const app = express();

    app.use(logger("combined"))
    app.params = params || {};

    const superListen = app.listen;
    app.listen = (port) => {
        if( port ) superListen.call(app,port);
        else {
            console.log(`Server listening on ${app.params.port || 5000}`)
            superListen.call(app,app.params.port || 5000);
        }
    }

    Object.assign(app,methods);

    return app;
}

export default DicomWebServer;