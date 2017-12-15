const https = require('https');
const http = require('http');
const log = require('./log');
const config = require('../config');
const UrlResolver = require('./web/urlResolver');
const fs = require('fs');
const Request = require('./request');
class Server{
    constructor(){
        this.runningSecure = false;
        this.runningNormal = false;
        /**
         * @type {Object.<string, Function(Request)>}
         */
        this.routes = {};
        this.defaultPath = config.websiteDirectory;
        this.domain = config.domain;
    }
    /**
     * 
     * @param {Request} request
     */
    handleRequest(request){
        if((!request.isSecure) && this.runningSecure){
            log.debug('rerouting to secure website');
            return request.redirect(request.getPath());
        }

        let path = request.getPath();
        let method = request.getMethod();
        if(this.routes[path]){
            log.debug(`[${method}] ${path}`)
            this.routes[path](request);
            return;
        }
        if(!config.enableWebsite) return request.notFound();
        log.debug(`[${method}] ${path}`);
        UrlResolver.resolve(`${this.defaultPath}${path}`, (success, resolvedUrl, handler) => {
            if(!success)
                return request.notFound();
            request.request.url = resolvedUrl;
            log.debug(`Resolved path to ${resolvedUrl}`);
            if(resolvedUrl.startsWith('/templates'))
                return request.notFound();
            handler.handleRequest(request);
        });
    }
    startSecure({key, cert, port}){
        if(this.runningSecure) return;
        this.runningSecure = true;
        let secureServer = https.createServer({key, cert, port}, (req, res) => this.handleRequest(new Request(req, res, true, this)));
        secureServer.listen(port);
        this.secureServer = secureServer;
        log.info(`https server running on port ${port}`);
    }
    startNormal(port){
        if(this.runningNormal) return;
        this.runningNormal = true;
        let server = http.createServer((req, res) => this.handleRequest(new Request(req, res, false, this)));
        server.listen(port);
        this.server = server;
        log.info(`http server running on port ${port}`);
    }
    /**
     * @param {string} route 
     * @param {function(Request):void} callbackFn 
     */
    registerRoute(route, callbackFn){
        log.debug(`Route registered: [${route}]`);
        this.routes[route] = callbackFn;
    }
}
module.exports = new Server();