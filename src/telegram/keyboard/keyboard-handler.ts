import { TelegramAnswerCallbackQuery, TelegramCallbackQuery } from "../../../typings/telegram";
import { info } from "../../utils/log";
import { CallbackQueryOutput } from "../outputs/callback-query-output";
import { TelegramBot } from "../telegram-bot";
import { KeyboardContext } from "./keyboard-context";

export type KeyboardHandlerCallback = (context: KeyboardContext, output: CallbackQueryOutput) => void | string;
export class KeyboardHandler {
    callbacks: { [key: string]: KeyboardHandlerCallback } = {};
    constructor(private bot : TelegramBot){
        
    }
    registerCallback(name: string, callback: KeyboardHandlerCallback) {
        if (this.callbacks[name])
            throw `Callback with name [${name}] already exists!`;
        this.callbacks[name] = callback;
    }
    registerHandler(handler : IKeyboardHandler){
        let names = handler.getCallbackNames();
        let callback : KeyboardHandlerCallback = (q, o) => handler.onQuery(q, o);
        if(typeof names == 'string'){
            this.registerCallback(names, callback);
        }else{
            names.forEach(name => this.registerCallback(name, callback));
        }
    }
    handleCallback(msg : TelegramCallbackQuery){
        let fullName = msg.data;
        let [name, ...params] = fullName.split('|');
        let callback = this.callbacks[name];
        if(!callback){
            info(`Received an unknown keyboard button callback: ${name}`);
            return;
        }
        let output = new CallbackQueryOutput(this.bot, msg);
        let result = callback(new KeyboardContext(name, params, msg), output);
        
        let reply : TelegramAnswerCallbackQuery = {
            callback_query_id: msg.id
        };
        if(result){
            reply.text = result;
            reply.show_alert =true;
        }
        this.bot.callApiMethod('answerCallbackQuery', reply);
    }
}
export interface IKeyboardHandler{
    getCallbackNames() : string | string[];
    onQuery(query : KeyboardContext, output : CallbackQueryOutput) : string | void;
}