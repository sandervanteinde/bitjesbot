"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../utils/log");
class KeyboardHandler {
    constructor() {
        this.callbacks = {};
    }
    registerCallback(name, callback) {
        if (this.callbacks[name])
            throw `Callback with name [${name}] already exists!`;
        this.callbacks[name] = callback;
    }
    handleCallback(msg) {
        let fullName = msg.data;
        let [name, ...params] = fullName.split('|');
        let callback = this.callbacks[name];
        if (!callback) {
            log_1.info(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
    }
}
exports.KeyboardHandler = KeyboardHandler;
class Keyboard {
    static button(text, callbackName, ...params) {
        let data = callbackName;
        if (params.length > 0) {
            data = `${data}|${params.join('|')}`;
        }
        return {
            text,
            callback_data: data
        };
    }
}
exports.Keyboard = Keyboard;
//# sourceMappingURL=keyboardhandler.js.map