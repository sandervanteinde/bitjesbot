"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./request");
const log_1 = require("./log");
const https_1 = require("https");
const http_1 = require("http");
const fs_1 = require("fs");
class Server {
    constructor() {
        this.runningSecure = false;
        this.runningNormal = false;
        this.routes = {};
    }
    startWithOptions(options, onStarted) {
        this.startNormal(options.webPort);
        if (options.key && options.cert) {
            let key;
            let cert;
            let onDone = () => {
                if (key == null || cert == null)
                    return;
                this.startSecure({ key, cert, port: options.port });
                onStarted();
            };
            fs_1.readFile(options.key, { encoding: 'utf8' }, (err, data) => {
                key = data;
                onDone();
            });
            fs_1.readFile(options.cert, { encoding: 'utf8' }, (err, data) => {
                cert = data;
                onDone();
            });
        }
        else {
            onStarted();
        }
    }
    handleRequest(request) {
        let { path, method } = request;
        log_1.debug(`[${method}] ${path}`);
        if (this.routes[path]) {
            this.routes[path](request);
        }
        else {
            log_1.info('Unknown request at above path!');
        }
    }
    startSecure({ key, cert, port }) {
        if (this.runningSecure)
            return;
        let secureServer = https_1.createServer({ key, cert }, (req, res) => this.handleRequest(new request_1.Request(req, res, true, this)));
        secureServer.listen(port);
        this.secureServer = secureServer;
        log_1.info(`https server running on port ${port}`);
    }
    startNormal(port) {
        if (this.runningNormal)
            return;
        this.runningNormal = true;
        let server = http_1.createServer((req, res) => this.handleRequest(new request_1.Request(req, res, false, this)));
        server.listen(port);
        this.server = server;
        log_1.info(`http server running on port ${port}`);
    }
    registerRoute(route, callbackFn) {
        log_1.debug(`Route rgistered: [${route}]`);
        this.routes[route] = callbackFn;
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map