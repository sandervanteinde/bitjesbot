import { TelegramOutput } from "./outputs/telegram-output";
import { TelegramMessageContext } from "./telegram-message-context";

export type SlashCommandCallback = (context: TelegramMessageContext, output: TelegramOutput) => void;
export type SlashCommandObject = {
    help: string | null,
    callback: SlashCommandCallback,
    groupOnly: boolean,
    privateOnly: boolean
}
export interface IBotCommand{
    getSlashCommands() : string | string[];
    onMessage(context: TelegramMessageContext, output : TelegramOutput) : void;
    getHelpMessageText() : string | (string | null)[] | null;
    isGroupOnly() : boolean;
    isPrivateOnly() : boolean;
}