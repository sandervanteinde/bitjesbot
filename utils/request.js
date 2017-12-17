const config = require('../config');
const mime = require('mime-types');
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
    success(data, {mime = undefined} = {}){
        this.setResponseStatusCode(200);
        if(mime)
            this.response.setHeader('Content-Type', mime);
        if(data)
            this.write(data);
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
     * @param {string} path 
     */
    setMimeForPath(path){
        this.response.setHeader('Content-Type', mime.lookup(path));
    }
    /**
     * @param {number} code 
     */
    setResponseStatusCode(code){
        this.response.statusCode = code;
    }
    /**
     * @param {string|Buffer} data 
     */
    write(data){
        this.response.write(data);
    }
    /**
     * @returns {string}
     */
    get path(){
        return this.request.url;
    }
    /**
     * @returns {string}
     */
    get method(){
        return this.request.method;
    }
}
module.exports = Request;