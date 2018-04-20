
class BodyParser{
    /**
    * @param {IncomingMessage} incomingMessage 
    * @param {function(string):void} callback
    */
    parseBody(incomingMessage, callback){
        let body = ''
        incomingMessage.on('data', chunk => {
            body += chunk;
        }).on('end', () => {
            if(callback)
                callback(body);
        });
    }
    /**
     * 
     * @param {IncomingMessage} incomingMessage 
     * @param {function(any):void} callback 
     */
    parseJson(incomingMessage, callback){
        this.parseBody(incomingMessage, msg => {
            if(callback)
                callback(JSON.parse(msg));
        });
    }
}
module.exports = new BodyParser();