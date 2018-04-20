import { TelegramUser, TelegramMessage, TelegramUpdate, TelegramResponse } from '../../typings/telegram';
import config from '../utils/config';
import { Server } from '../utils/server';
import loop from '../utils/loop';
import { request } from 'https';
import bodyparser from '../utils/bodyparser';
import { SlashCommandObject, SlashCommandCallback, IBotCommand } from './bot-helpers';
import { TelegramMessageContext } from './telegram-message-context';
import { TelegramMessageOutput } from './telegram-message-output';

export class TelegramBot {
    slashCommands: { [slashCommand: string]: SlashCommandObject } = {};
    me: TelegramUser | undefined;
    polling: boolean = false;
    lastMessage: number = 0;
    url: string = `bot${config.API_KEY}`;
    onPlainTextMessage = {};
    replyHandlers = {};
    private registerSlashCommand(
        command: string,
        helpMessage: string | null,
        callback: SlashCommandCallback,
        { groupOnly, privateOnly }: { groupOnly: boolean, privateOnly: boolean } = { groupOnly: false, privateOnly: false }
    ) {
        if (this.slashCommands[command])
            throw `A command with the name ${command} already exists!`;
        let obj: SlashCommandObject = { help: helpMessage, callback, groupOnly, privateOnly };
        this.slashCommands[command] = obj;
    }
    registerBotCommand(command : IBotCommand){
        let slashCommands = command.getSlashCommands();
        let help = command.getHelpMessageText();
        let options = {
            groupOnly: command.isGroupOnly(),
            privateOnly: command.isPrivateOnly()
        }
        let callback = (context : TelegramMessageContext, output : TelegramMessageOutput) => command.onMessage(context, output);
        if(slashCommands instanceof Array){
            slashCommands.forEach(s => this.registerSlashCommand(s, help, callback, options));
        }else{
            this.registerSlashCommand(slashCommands, help, callback, options);
        }
    }

    callApiMethod<TExpectedReturn>(
        method: string,
        body?: { [key: string]: any },
        callback?: (resp: TelegramResponse<TExpectedReturn>) => void,
        error?: (err: NodeJS.ErrnoException | TelegramResponse<TExpectedReturn>) => void
    ) {
        let postOptions = {
            host: 'api.telegram.org',
            path: `/${this.url}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };
        let req = request(postOptions, (res) => bodyparser.parseJson<TelegramResponse<TExpectedReturn>>(res, responseBody => {
            if (!responseBody.ok) {
                if (error)
                    error(responseBody);
                else
                    console.error('Unhandled wrongly parsed message!', responseBody);
            }
            else if (callback)
                callback(responseBody);
        }));
        if (error)
            req.on('error', error);
        else
            req.on('error', (err: NodeJS.ErrnoException) => {
                this.polling = false;
                if (err.code == 'ETIMEDOUT' && method == 'getUpdates')
                    return;//not important, this happens when polling
                console.error({
                    method,
                    message: 'Unhandled API error!',
                    inner: err,
                });
            });
        if (body)
            req.write(JSON.stringify(body));
        req.end();
    }

    private setWebhook(domain: string, server: Server) {
        let route = `/${config.API_KEY}`;
        server.registerRoute(route, (req) => {
            req.asObject<TelegramUpdate>(obj => {
                this.onMessageReceived(obj);
            });
            req.success();
        });
        let url = `https://${domain}${route}`;
        this.callApiMethod('setWebhook', { url });
    }

    private deleteWebhook() {
        this.callApiMethod('deleteWebhook');
    }
    private pollMessages() {
        if (this.polling) return;
        this.polling = true;
        this.callApiMethod<TelegramUpdate[]>('getUpdates', { offset: this.lastMessage + 1 }, body => {
            if (!body.ok)
                return;
            body.result.forEach(msg => this.onMessageReceived(msg));
            this.polling = false;
        });
    }

    private onMessageReceived(update: TelegramUpdate) {
        try {
            if(update.message)
                this.processMessage(update.message);
        } catch{
            
        } finally {
            this.lastMessage = update.update_id;
        }
    }
    private processMessage(message : TelegramMessage){
        if(message.text)
            this.processTextMessage(message);
    }
    private processTextMessage(message : TelegramMessage){
        if(message.text[0] == '/'){
            return this.interpretSlashCommand(message);
        }
    }
    private interpretSlashCommand(message : TelegramMessage){
        let [command, ...args] = message.text.split(' ');
        command = command.substring(1).toLowerCase();
        let obj = this.slashCommands[command];
        let context = new TelegramMessageContext(message, command, args);
        let output = new TelegramMessageOutput(this, message);
        if(obj){
            let {callback, privateOnly, groupOnly} = obj;
            if(groupOnly && context.PrivateChat)
                output.sendToChat('This command is only available in group chats');
            else if(privateOnly && context.GroupChat)
                output.sendToChat('This command is only available in private chats');
            else
                callback(context, output);
        }else{
            output.sendToChat('Unknown command. Type /help for commands!');
        }
    }

    private setupDefaultCallbacks() {
        this.registerSlashCommand('help', null, (context, output) => {
            let commands: string[] = [];
            for (let slashCommand in this.slashCommands) {
                if (slashCommand.indexOf('@') >= 0) continue;
                let { help, groupOnly, privateOnly } = this.slashCommands[slashCommand];
                if (groupOnly && context.PrivateChat) continue;
                if (privateOnly && context.GroupChat) continue;
                if (help)
                    commands.push(`/${slashCommand} - ${help}`);
            }
            output.sendToChat(`Available commands:\n\n${commands.join('\n')}`);
        });
        this.registerSlashCommand('about', 'About this bot', (msg, output) => {
            output.sendToChat('This bot is made by Sander van \'t Einde.\nYou can view the source at https://www.github.com/sandervanteinde/bitjesbot');
        });
    }
    start(server?: Server) {
        if (server) { //start as webhooks
            if (!config.domain)
                throw 'A domain must be registered to start the bot with Webhooks';
            if (!server.runningSecure)
                throw 'The web server must be running secure before you can start the telegram bot in webhook mode!';
            this.setWebhook(config.domain, server);
        } else {
            this.deleteWebhook();
            loop.subscribe(() => this.pollMessages())
        }
        this.setupDefaultCallbacks();
    }
}