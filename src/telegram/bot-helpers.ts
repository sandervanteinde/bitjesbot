import { TelegramMessage } from "../../typings/telegram";
import { TelegramMessageOutput } from "./telegram-message-output";
import { TelegramMessageContext } from "./telegram-message-context";

export type SlashCommandCallback = (context: TelegramMessageContext, output: TelegramMessageOutput) => void;
export type SlashCommandObject = {
    help: string | null,
    callback: SlashCommandCallback,
    groupOnly: boolean,
    privateOnly: boolean
}
export interface IBotCommand{
    getSlashCommands() : string | string[];
    onMessage(context: TelegramMessageContext, output : TelegramMessageOutput) : void;
    getHelpMessageText() : string | null;
    isGroupOnly() : boolean;
    isPrivateOnly() : boolean;
}