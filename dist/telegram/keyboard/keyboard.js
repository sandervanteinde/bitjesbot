"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function button(text, callbackName, ...params) {
    let data = callbackName;
    if (params.length > 0) {
        data = `${data}|${params.join('|')}`;
    }
    return {
        text,
        callback_data: data
    };
}
exports.button = button;
function formatButtons(...buttons) {
    let result = [];
    let maxSize = buttons.length > 8 ? 3 : 2;
    //go by rows of 3
    let currentArr = [];
    for (let i = 0; i < buttons.length; i++) {
        currentArr.push(buttons[i]);
        if (currentArr.length == maxSize) {
            result.push(currentArr);
            currentArr = [];
        }
    }
    if (currentArr.length > 0)
        result.push(currentArr);
    return result;
}
exports.formatButtons = formatButtons;
//# sourceMappingURL=keyboard.js.map