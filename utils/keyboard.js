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
     * @param {string[]} params
     */
    button(text, callbackName, ...params){
        if(!this.callbacks[callbackName])
            console.error(`The callback for '${callbackName}' is not defined. Make sure it's set by calling registerCallback first!`);
        let data = callbackName;
        if(params.length > 0)
            data = `${data}|${params.join('|')}`;
        return {
            text,
            callback_data: data
        };
    }
    /**
     * 
     * @param {string} name 
     * @param {function(Object,string,string[]):void} callback 
     */
    registerCallback(name, callback){
        this.callbacks[name] = callback;
    }
    /**
     * @param {object} msg 
     */
    handleCallback(msg){
        let fullName = msg.data;
        let [name, ...params] = fullName.split('|');
        let callback = this.callbacks[name];
        if(!callback){
            console.error(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
        callback(msg, name, params);
    }
}
module.exports = new KeyboardHandler();