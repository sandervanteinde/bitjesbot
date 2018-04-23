import { TelegramInlineKeyboardButton } from "../../../typings/telegram";

export function button(text: string, callbackName: string, ...params: string[]): TelegramInlineKeyboardButton {
    let data = callbackName;
    if (params.length > 0) {
        data = `${data}|${params.join('|')}`;
    }
    return {
        text,
        callback_data: data
    }
}
export function formatButtons(...buttons: TelegramInlineKeyboardButton[]): TelegramInlineKeyboardButton[][] {
    let result: TelegramInlineKeyboardButton[][] = [];
    let maxSize = buttons.length > 8 ? 3 : 2;
    //go by rows of 3
    let currentArr: TelegramInlineKeyboardButton[] = [];
    for (let i = 0; i < buttons.length; i++) {
        currentArr.push(buttons[i]);
        if (currentArr.length == maxSize){
            result.push(currentArr);
            currentArr = [];
        }
    }
    if (currentArr.length > 0)
        result.push(currentArr);
    return result;
}