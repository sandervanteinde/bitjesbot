class KeyboardHandler {
    constructor(){
        /**
         * @type {Object.<string,Function>}
         */
        this.callbacks = {};
    }
    /**
     * @param {string} text 
     * @param {string} callbackName 
     */
    button(text, callbackName){
        if(!this.callbacks[callbackName])
            console.error(`The callback for '${callbackName}' is not defined. Make sure it's set by calling registerCallback first!`);
        return {
            text,
            callback_data: callbackName
        };
    }
    /**
     * 
     * @param {string} name 
     * @param {function(Object):void} callback 
     */
    registerCallback(name, callback){
        this.callbacks[name] = callback;
    }
    /**
     * @param {object} msg 
     */
    handleCallback(msg){
        let name = msg.data;
        let callback = this.callbacks[name];
        if(!callback){
            console.error(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
        callback(msg);
    }
}
module.exports = new KeyboardHandler();