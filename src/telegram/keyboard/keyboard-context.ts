import { TelegramCallbackQuery } from "../../../typings/telegram";
export class KeyboardContext{
    constructor(public callbackName : string, public args : string[], public query : TelegramCallbackQuery){

    }
}