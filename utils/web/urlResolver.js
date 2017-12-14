const fs = require('fs');
const log = require('../log');
class UrlResolver{
    constructor(){
        this.strategies = [
            '{url}',
            '{url}.html',
            '{url}index.html',
            '{url}/index.html'
        ];
    }
    /**
     * @param {string} url
     * @param {function(boolean,string)} callback
     */
    resolve(url, callback)
    {
        log.debug(`attempting to resolve: ${url}`);
        for(let strategy of this.strategies){
            let parsedUrl = strategy.replace('{url}', url);
            if(fs.existsSync(parsedUrl)){
                let stats = fs.statSync(parsedUrl);
                if(!stats.isDirectory()){
                    callback(true, parsedUrl);
                    return;
                }
            }
        }
        callback(false, null);
    }
}
module.exports = new UrlResolver();