const https = require('https');
const http = require('http');
const log = require('./log');
const config = require('../config');
const UrlResolver = require('./web/urlResolver');
const fs = require('fs');
class Request{
    /**
     * @param {IncomingMessage} request 
     * @param {ServerResponse} response 
     * @param {boolean} isSecure
     * @param {Server} server
     */
    constructor(request, response, isSecure, server){
        this.request = request;
        this.response = response;
        this.isSecure = isSecure;
        this.server = server;
    }
    notFound(){
        this.response.statusCode = 404;
        this.response.end();
    }
    success(data){
        this.response.statusCode = 200;
        if(data)
            this.response.write(data);
        this.response.end();
    }
    /**
     * 
     * @param {string} url 
     */
    redirect(url){
        this.response.statusCode = 302;
        this.response.setHeader('Location', (url.startsWith('http://') || url.startsWith('https://')) && url || `http${this.server.runningSecure && 's' || ''}://${config.domain}${url}`);
        this.response.end();
    }
    /**
     * @returns {string}
     */
    getPath(){
        return this.request.url;
    }
    /**
     * @returns {string}
     */
    getMethod(){
        return this.request.method;
    }
}
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
        UrlResolver.resolve(`${this.defaultPath}${path}`, (success, resolvedUrl) => {
            if(!success)
                return request.notFound();
            log.debug(`Resolved path to ${resolvedUrl}`);
            fs.readFile(resolvedUrl, (err, buffer)=> {
                if(err) throw err;
                request.success(buffer);
            })
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