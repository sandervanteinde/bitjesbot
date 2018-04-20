const fs = require('fs');
const log = require('../log');
const config = require('../../config');
class UrlResolver{
    constructor(){
        this.strategies = [
        ];
        this.ignoresUrls = [
        ];
    }
    /**
     * @param {string} url
     * @param {function(boolean,string, handlers.Handler)} callback
     */
    resolve(url, callback)
    {
        for(let i = 0; i < this.ignoresUrls.length; i++)
            if(url.startsWith(this.ignoresUrls[i]))
                return callback(false);

        let attemptIndex = index => {
            if(index >= this.strategies.length)
                return callback(false);
            let [strategy, handler] = this.strategies[index];
            let parsedUrl = strategy.replace('{url}', url);
            fs.exists(parsedUrl, exists => {
                if(!exists)
                    return attemptIndex(index + 1);
                
                fs.stat(parsedUrl, (err, stats) => {
                    if(err) throw err;
                    if(!stats.isDirectory()){
                        if(!handler){
                            handler = this.getHandlerForUrl(parsedUrl);
                        }
                        return callback(true, parsedUrl, handler);
                    }
                    return attemptIndex(index + 1);
                });
            });
        }
        log.debug(`attempting to resolve: ${url}`);
        attemptIndex(0);
    }
}
module.exports = new UrlResolver();