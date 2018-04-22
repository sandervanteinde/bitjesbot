import { IBotCommand } from "../bot-helpers";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramMessageOutput } from "../outputs/telegram-message-output";
import { Database } from "../../utils/db";
import { Server } from "../../utils/server";
import bodyparser from "../../utils/bodyparser";
import { TelegramBot } from "../telegram-bot";
import { TelegramOutput } from "../outputs/telegram-output";
import { ChatIdOutput } from "../outputs/chat-id-output";

type IskaDatabaseEntry = { id: number };
export class IskaCommand implements IBotCommand {
    database: Database<IskaDatabaseEntry> = new Database<IskaDatabaseEntry>('iska');
    constructor(server: Server, private bot: TelegramBot) {
        server.registerRoute('/36d6abd6-73a2-4c92-bcda-815ffb422ea3', (req) => {
            bodyparser.parseJson<{ text: string }>(req.Request, body => {
                req.success();
                this.broadcastTweet(body.text);
            });
        });
        this.database.load();
    }

    getSlashCommands(): string | string[] {
        return 'iska';
    }
    getHelpMessageText(): string | null {
        return 'Toggles ISKA twitter notifications';
    }
    isGroupOnly(): boolean {
        return false;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput): void {
        if (context.message.from.username.toLowerCase() == 'berwout') {
            output.sendToChat('@Berwout was blocked from using this command.', { reply: true });
            return;
        }
        let id = context.message.chat.id;
        let items = this.database.filter(c => c.id == id);
        let exists = items.length == 1;
        if (exists) {
            this.database.delete({ id });
        } else {
            this.database.add({ id })
        };
        this.database.saveChanges();
        output.sendToChat(exists ? 'Removed you from the ISKA list.' : 'Added you to the ISKA list.', {
            reply: true
        });
    }
    private broadcastTweet(text: string) {
        let message = `ISKA heeft zojuist getweet:\n${text}`;
        for (let entry of this.database) {
            let output = new ChatIdOutput(this.bot, entry.id);
            output.sendToChat(message);
        }
    }
}