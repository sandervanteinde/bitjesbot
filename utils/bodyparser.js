/**
 * @param {IncomingMessage} incomingMessage 
 * @param {function} callback
 */
function parseBody(incomingMessage, callback){
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
 * @param {Function} callback 
 */
function parseJson(incomingMessage, callback){
    parseBody(incomingMessage, msg => {
        if(callback)
            callback(JSON.parse(msg));
    })
}
module.exports = {
    parseBody,
    parseJson
}