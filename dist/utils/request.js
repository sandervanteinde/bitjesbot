"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Request {
    constructor(request, response, isSecure, server) {
        this.request = request;
        this.response = response;
        this.isSecure = isSecure;
        this.server = server;
    }
    get path() {
        return this.request.url;
    }
    get method() {
        return this.request.method;
    }
    get Request() { return this.request; }
    success(data, { mime } = {}) {
        this.response.statusCode = 200;
        if (mime)
            this.response.setHeader('Content-Type', mime);
        if (data)
            this.write(data);
        this.response.end();
    }
    write(data) {
        this.response.write(data);
    }
    asString(callback) {
        let body = '';
        this.request.on('data', chunk => {
            body += chunk;
        }).on('end', () => {
            callback(body);
        });
    }
    asObject(callback) {
        this.asString(str => callback(JSON.parse(str)));
    }
}
exports.Request = Request;
//# sourceMappingURL=request.js.map