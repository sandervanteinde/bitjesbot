let callbacks = {};
/**
 * @param {string} text 
 * @param {string} callbackName 
 */
function button(text, callbackName){
    if(!callbacks[callbackName])
        console.error(`The callback for '${callbackName}' is not defined. Make sure it's set by calling registerCallback first!`);
    return {
        text,
        callback_data: callbackName
    };
}
/**
 * 
 * @param {string} name 
 * @param {function} callback 
 */
function registerCallback(name, callback){
    callbacks[name] = callback;
}
/**
 * @param {object} msg 
 */
function handleCallback(msg){
    let name = msg.data;
    let callback = callbacks[name];
    if(!callback)
        console.error(`Received an unknown keyboard button callback: ${name}`);
    callback(msg);
}
module.exports = {
    button,
    handleCallback,
    registerCallback
}