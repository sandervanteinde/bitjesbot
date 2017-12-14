const https = require('https');
const http = require('http');
const log = require('./log');
const config = require('../config');
const UrlResolver = require('./web/urlResolver');
const fs = require('fs');
class Server{
    constructor(){
        this.runningSecure = false;
        this.runningNormal = false;
        this.routes = {};
        this.defaultPath = config.websiteDirectory;
    }
    /**
     * 
     * @param {http:IncomingMessage} req 
     * @param {ServerResponse} res 
     */
    handleRequest(req, res){
        log.debug(`Handling request: [${req.method}] ${req.url}}`);
        let url = req.url;
        if(this.routes[url]){
            this.routes[url](req, res);
            return;
        }
        UrlResolver.resolve(`${this.defaultPath}${url}`, (success, resolvedUrl) => {
            if(!success){
                res.statusCode = 404;
                res.end();
                return;
            }
            log.debug(`Resolved path to ${resolvedUrl}`);
            fs.readFile(resolvedUrl, (err, buffer)=> {
                if(err) throw err;
                res.write(buffer);
                res.statusCode = 200;
                res.end();
            })
        });
    }
    startSecure({key, cert, port}){
        if(this.runningSecure) return;
        this.runningSecure = true;
        let secureServer = https.createServer({key, cert, port}, (req, res) => this.handleRequest(req, res));
        secureServer.listen(port);
        this.secureServer = secureServer;
        log.info(`https server running on port ${port}`);
    }
    startNormal(port){
        if(this.runningNormal) return;
        this.runningNormal = true;
        let server = http.createServer((req, res) => this.handleRequest(req, res));
        server.listen(port);
        this.server = server;
        log.info(`http server running on port ${port}`);
    }
    /**
     * @param {string} route 
     * @param {function(http:IncomingMessage,http:ServerResponse)} callbackFn 
     */
    registerRoute(route, callbackFn){
        routes[route] = callbackFn;
    }
}
module.exports = new Server();