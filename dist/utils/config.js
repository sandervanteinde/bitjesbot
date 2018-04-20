"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class Config {
    constructor(options) {
        this.options = options;
    }
    get Options() { return this.options; }
}
let jsonString = fs_1.readFileSync('./config.json', { encoding: 'utf8' });
let json = JSON.parse(jsonString);
exports.default = new Config(json).Options;
//# sourceMappingURL=config.js.map