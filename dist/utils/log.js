"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
function debug(...params) {
    if (config_1.default.loggingLevel <= 1) {
        console.log(...params);
    }
}
exports.debug = debug;
function info(...params) {
    console.log(...params);
}
exports.info = info;
//# sourceMappingURL=log.js.map