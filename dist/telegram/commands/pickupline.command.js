"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const bodyparser_1 = require("../../utils/bodyparser");
class PickupLineCommand {
    getSlashCommands() {
        return 'pickupline';
    }
    getHelpMessageText() {
        return 'Retrieves a random pickup line';
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        http_1.get('http://pebble-pickup.herokuapp.com/tweets/random', (res) => bodyparser_1.default.parseJson(res, content => {
            let msg = content.tweet.replace('[Your Name]', context.message.from.first_name);
            output.sendToChat(msg, { reply: true });
        }));
    }
}
exports.PickupLineCommand = PickupLineCommand;
//# sourceMappingURL=pickupline.command.js.map