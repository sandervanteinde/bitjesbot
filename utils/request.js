const config = require('../config');
/**
 * @param {Request} request 
 * @param {string} cookieString 
 */
function parseCookies(request, cookieString){
    cookieString.split(';').forEach(cookie => {
        [key, value] = cookie.split('=');
        request.cookies[key] = value;
    });
}

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
        /**
         * @type {Object.<string, string>}
         */
        this.cookies = {};
        if(request.headers.cookie)
            parseCookies(this, request.headers.cookie);
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
module.exports = Request;