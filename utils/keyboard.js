
class KeyboardHandler {
    constructor() {
        /**
         * @type {Object.<string,Function>}
         */
        this.callbacks = {};
    }
    /**
     * @param {string} text 
     * @param {string} callbackName
     * @param {string[]} params
     * @returns {TelegramInlineKeyboardButton}
     */
    button(text, callbackName, ...params) {
        if (!this.callbacks[callbackName])
            console.error(`The callback for '${callbackName}' is not defined. Make sure it's set by calling registerCallback first!`);
        let data = callbackName;
        if (params.length > 0)
            data = `${data}|${params.join('|')}`;
        return {
            text,
            callback_data: data
        };
    }
    /**
     * 
     * @param {string} name 
     * @param {function(TelegramCallbackQuery,string,string[]):void} callback 
     */
    registerCallback(name, callback) {
        this.callbacks[name] = callback;
    }
    /**
     * @param {TelegramCallbackQuery} msg 
     */
    handleCallback(msg) {
        let fullName = msg.data;
        let [name, ...params] = fullName.split('|');
        /**
         * @type {function(TelegramCallbackQuery,string,string[]):void}
         */
        let callback = this.callbacks[name];
        if (!callback) {
            console.error(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
        callback(msg, name, params);
    }
    formatButtons(...buttons) {
        let result = [];
        let maxSize = buttons.length > 8 ? 3 : 2;
        //go by rows of 3
        let currentArr = [];
        for (let i = 0; i < buttons.length; i++) {
            currentArr.push(buttons[i]);
            if (currentArr.length == maxSize)
                result.push(currentArr);
        }
        if (currentArr.length > 0)
            result.push(currentArr);
        return currentArr;
    }

}
module.exports = new KeyboardHandler();