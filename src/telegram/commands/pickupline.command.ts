import { IBotCommand } from "../bot-helpers";
import { TelegramMessageContext } from "../telegram-message-context";
import { TelegramMessageOutput } from "../outputs/telegram-message-output";
import { get } from "http";
import bodyparser from "../../utils/bodyparser";
import { TelegramOutput } from "../outputs/telegram-output";

export class PickupLineCommand implements IBotCommand {
    getSlashCommands(): string | string[] {
        return 'pickupline';
    }
    getHelpMessageText(): string | null {
        return 'Retrieves a random pickup line';
    }
    isGroupOnly(): boolean {
        return false;
    }
    isPrivateOnly(): boolean {
        return false;
    }
    onMessage(context: TelegramMessageContext, output: TelegramOutput) {
        get('http://pebble-pickup.herokuapp.com/tweets/random', (res)=> bodyparser.parseJson<{tweet: string}>(res, content => {
            let msg = content.tweet.replace('[Your Name]', context.message.from.first_name);
            output.sendToChat(msg, {reply: true});
        }));
    }
}