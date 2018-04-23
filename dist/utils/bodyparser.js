"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BodyParser {
    parseBody(incomingMessage, callback) {
        let body = '';
        incomingMessage.on('data', chunk => {
            body += chunk;
        }).on('end', () => {
            if (callback)
                callback(body);
        });
    }
    parseJson(incomingMessage, callback) {
        this.parseBody(incomingMessage, msg => {
            if (callback)
                callback(JSON.parse(msg));
        });
    }
}
exports.default = new BodyParser();
//# sourceMappingURL=bodyparser.js.map