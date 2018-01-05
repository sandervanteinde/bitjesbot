class PrivateMessage{
    /**
     * 
     * @param {string} identifier 
     * @param {string} message 
     * @param {*} data
     * @param {function(*):void} callback 
     * @param {any[][]} keyboard 
     */
    constructor(identifier, message, data, callback, keyboard, error){
        this.identifier = identifier;
        this.data = data;
        this.message = message;
        this.callback = callback;
        this.keyboard = keyboard;
        this.error = error;
    }
}
module.exports = PrivateMessage;
