const fs = require('fs');
const log = require('../log');
const handlers = require('./handlers');
class UrlResolver{
    constructor(){
        this.strategies = [
            ['{url}', null],
            ['{url}.component.js', handlers.ComponentParser],
            ['{url}.html', handlers.FileHandler],
            ['{url}index.component.js', handlers.ComponentParser],
            ['{url}index.html', handlers.FileHandler],
            ['{url}/index.component.js', handlers.ComponentParser],
            ['{url}/index.html', handlers.FileHandler],
        ];
    }
    /**
     * @param {string} url
     * @param {function(boolean,string, handlers.Handler)} callback
     */
    resolve(url, callback)
    {
        log.debug(`attempting to resolve: ${url}`);
        for(let pair of this.strategies){
            let [strategy, handler] = pair;
            let parsedUrl = strategy.replace('{url}', url);
            if(fs.existsSync(parsedUrl)){
                let stats = fs.statSync(parsedUrl);
                if(!stats.isDirectory()){
                    if(!handler){
                        handler = this.getHandlerForUrl(parsedUrl);
                    }
                    callback(true, parsedUrl, handler);
                    return;
                }
            }
        }
        callback(false, null);
    }
    /**
     * @param {string} url 
     * @returns {Handler} handler
     */
    getHandlerForUrl(url){
        if(url.endsWith('.component.js'))
            return handlers.ComponentParser;
        else
            return handlers.FileHandler;
    }
}
module.exports = new UrlResolver();