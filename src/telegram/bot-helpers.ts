import { TelegramMessage } from "../../typings/telegram";
import { TelegramMessageContext } from "./telegram-message-context";
import { TelegramOutput } from "./outputs/telegram-output";

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
    getHelpMessageText() : string | null;
    isGroupOnly() : boolean;
    isPrivateOnly() : boolean;
}