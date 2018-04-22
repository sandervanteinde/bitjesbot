"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../utils/db");
const bodyparser_1 = require("../../utils/bodyparser");
const chat_id_output_1 = require("../outputs/chat-id-output");
class IskaCommand {
    constructor(server, bot) {
        this.bot = bot;
        this.database = new db_1.Database('iska');
        server.registerRoute('/36d6abd6-73a2-4c92-bcda-815ffb422ea3', (req) => {
            bodyparser_1.default.parseJson(req.Request, body => {
                req.success();
                this.broadcastTweet(body.text);
            });
        });
        this.database.load();
    }
    getSlashCommands() {
        return 'iska';
    }
    getHelpMessageText() {
        return 'Toggles ISKA twitter notifications';
    }
    isGroupOnly() {
        return false;
    }
    isPrivateOnly() {
        return false;
    }
    onMessage(context, output) {
        if (context.message.from.username.toLowerCase() == 'berwout') {
            output.sendToChat('@Berwout was blocked from using this command.', { reply: true });
            return;
        }
        let id = context.message.chat.id;
        let items = this.database.filter(c => c.id == id);
        let exists = items.length == 1;
        if (exists) {
            this.database.delete({ id });
        }
        else {
            this.database.add({ id });
        }
        ;
        this.database.saveChanges();
        output.sendToChat(exists ? 'Removed you from the ISKA list.' : 'Added you to the ISKA list.', {
            reply: true
        });
    }
    broadcastTweet(text) {
        let message = `ISKA heeft zojuist getweet:\n${text}`;
        for (let entry of this.database) {
            let output = new chat_id_output_1.ChatIdOutput(this.bot, entry.id);
            output.sendToChat(message);
        }
    }
}
exports.IskaCommand = IskaCommand;
//# sourceMappingURL=iska.command.js.map