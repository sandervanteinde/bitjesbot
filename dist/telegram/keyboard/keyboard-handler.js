"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../utils/log");
const callback_query_output_1 = require("../outputs/callback-query-output");
const keyboard_context_1 = require("./keyboard-context");
class KeyboardHandler {
    constructor(bot) {
        this.bot = bot;
        this.callbacks = {};
    }
    registerCallback(name, callback) {
        if (this.callbacks[name])
            throw `Callback with name [${name}] already exists!`;
        this.callbacks[name] = callback;
    }
    registerHandler(handler) {
        let names = handler.getCallbackNames();
        let callback = (q, o) => handler.onQuery(q, o);
        if (typeof names == 'string') {
            this.registerCallback(names, callback);
        }
        else {
            names.forEach(name => this.registerCallback(name, callback));
        }
    }
    handleCallback(msg) {
        let fullName = msg.data;
        let [name, ...params] = fullName.split('|');
        let callback = this.callbacks[name];
        if (!callback) {
            log_1.info(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
        let output = new callback_query_output_1.CallbackQueryOutput(this.bot, msg);
        let result = callback(new keyboard_context_1.KeyboardContext(name, params, msg), output);
        let reply = {
            callback_query_id: msg.id
        };
        if (result) {
            reply.text = result;
            reply.show_alert = true;
        }
        this.bot.callApiMethod('answerCallbackQuery', reply);
    }
}
exports.KeyboardHandler = KeyboardHandler;
//# sourceMappingURL=keyboard-handler.js.map