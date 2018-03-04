const loop = require('../utils/loop');
const https = require('https');
const config = require('../config');
const bodyparser = require('../utils/bodyparser');
const keyboard = require('../utils/keyboard');
const fs = require('fs');
const log = require('../utils/log');
const server = require('../utils/server');
let slashCommands = {};

let polling = false;
let lastMessage = 0;
let url = `bot${config.API_KEY}`;
let onPlainTextMessage = [];

/**
 * @param {string} command
 * @param {string} help
 * @param {function(TelegramMessage,string,string[]):void} callback 
 */
function registerSlashCommand(command, help, callback, {groupOnly = false} = {}){
    if(slashCommands[command])
    error(`A command with the name ${command} already exists!`);
    let obj = {help, callback, groupOnly};
    slashCommands[command] = obj;
    slashCommands[`${command}@${config.botName}`] = obj;
}
function sendMessage({chatId, message, callback = null, keyboard = [], replyId = null, parse_mode = null, error}){
    /**
     * @type {TelegramSendMessage}
     */
    let options = {
        chat_id: chatId,
        text: message
    };
    if(replyId !== null)
        options.reply_to_message_id = replyId;
    if(keyboard.length > 0)
        options.reply_markup = {inline_keyboard: keyboard};
    if(parse_mode)
        options.parse_mode = parse_mode;
    callApiMethod('sendMessage', options, callback, error);
}

/**
 * @param {string} method 
 * @param {*} body 
 * @param {function(TelegramResponse<*>)} callback 
 * @param {function(any)} error
 */
function callApiMethod(method, body = null, callback, error){
    let postOptions = {
        host: 'api.telegram.org',
        path: `/${url}/${method}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 5000
    };
    let request = https.request(postOptions, (res) => bodyparser.parseJson(res, responseBody => {
        if(!responseBody.ok){
            if(error)
                error(responseBody);
            else
                console.error('Unhandled wrongly parsed message!', responseBody);
        }
        else if(callback)
            callback(responseBody);
    }));
    if(error)
        request.on('error', error);
    else
        request.on('error', err => {
            polling = false;
            if(err.code == 'ETIMEDOUT' && method == 'getUpdates')
                return;//not important, this happens when polling
            console.error({
                method,
                message: 'Unhandled API error!',
                inner: err,
            });
        });
    if(body)
        request.write(JSON.stringify(body));
    request.end();
}
/**
 * @param {TelegramMessage} msg 
 */
function sendUnknownCommand(msg){
    sendMessage({chatId: msg.chat.id, message: 'Unknown command. Type /help for commands!'});
}
/**
 * @param {TelegramMessage} msg 
 */
function processTextMessage(msg){
    if(msg.text[0] != '/'){
        if(onPlainTextMessage)
            onPlainTextMessage(msg);
        return;
    }
    let [command, ...args] = msg.text.split(' ');
    command = command.substring(1).toLowerCase();
    let callback = slashCommands[command];
    if(callback){
        if(callback.groupOnly && msg.chat.type != 'group')
            sendMessage({chatId: msg.chat.id, message: 'This command is only available to group chats.'});
        else
            callback.callback(msg, command, ...args);
    }else
        sendUnknownCommand(msg);
}
/**
 * @param {TelegramMessage} msg 
 */
function processMessage(msg){
    if(msg.text)
        processTextMessage(msg);
}
/**
 * 
 * @param {TelegramUpdate} update 
 */
function onMessageReceived(update){
    if(update.message)
        processMessage(update.message);
    else if(update.callback_query){
        keyboard.handleCallback(update.callback_query);
        if(!update.callback_query.answered)
            answerCallbackQuery(update.callback_query.id);
    }
    else
        console.error("Unhandled message received", update);
    lastMessage = update.update_id;
}
function deleteWebhook(){
    callApiMethod('deleteWebhook');
}
function pollMessage(){
    if(polling) return;
    polling = true;
    callApiMethod('getUpdates', {offset: lastMessage + 1}, body => {
        if(!body.ok)
            return;
        body.result.forEach(onMessageReceived);
        polling = false;
    });
}
function setWebhook(domain){
    server.registerRoute(`/${config.API_KEY}`, (request) => {
        bodyparser.parseJson(request.request, body => {
            onMessageReceived(body);
            request.success();
        });
    });
    let webhookUrl = `https://${domain}/${config.API_KEY}`;
    log.debug(`Setting webhook to: ${webhookUrl}`);
    callApiMethod('setWebhook', {url: webhookUrl});
}
/**
 * @param {TelegramMessage} msg 
 */
function helpCallback(msg){
    let commands = [];
    for(let slashCommand in slashCommands){
        if(slashCommand.indexOf('@') >= 0) continue;
        let data = slashCommands[slashCommand];
        if(data.groupOnly && msg.chat.type != 'group') continue;
        if(slashCommands[slashCommand].help)
            commands.push(`/${slashCommand} - ${slashCommands[slashCommand].help}`);
    }
    let sendMsg = `Available commands:\n\n${commands.join('\n')}`;
    sendMessage({chatId: msg.chat.id, message: sendMsg});
}
function aboutCallback(msg){
    sendMessage({chatId: msg.chat.id, message: 'This bot is made by Sander van \'t Einde.\nYou can view the source at https://www.github.com/sandervanteinde/bitjesbot'});
}
/**
 * 
 * @param {number} id 
 * @param {function} callback
 * @param {string} notification 
 */
function answerCallbackQuery(id, {callback = null, notification = null} = {}){
    let options = {
        callback_query_id: id
    };
    if(notification)
    {
        options.show_alert = true;
        options.text = notification;
    }
    callApiMethod('answerCallbackQuery', options, callback);
}
/**
 * 
 * @param {number} chat_id 
 * @param {number} message_id 
 * @param {string} text 
 */
function editMessage(chat_id, message_id, text, {keyboard = null, parse_mode = null} = {}){
    let options = {chat_id, message_id, text};
    if(keyboard !== null)
        options.reply_markup = {inline_keyboard: keyboard};
    if(parse_mode !== null)
        options.parse_mode = parse_mode;
    callApiMethod('editMessageText', options);
}
if(config.domain){
    if(config.cert === null || config.key === null)
        throw "Webhooks require a certificate and key to run a server!";
    setWebhook(config.domain, config.key, config.cert, config);
}
else{
    deleteWebhook();
    loop.subscribe(pollMessage);
}
function registerPlainTextMessageHandler(callback){
    onPlainTextMessage = callback;
}
registerSlashCommand('help', 'This command', helpCallback);
registerSlashCommand('about', 'About this bot', aboutCallback);

module.exports = {
    sendMessage,
    registerSlashCommand,
    answerCallbackQuery,
    editMessage,
    registerPlainTextMessageHandler
};
log.info('Bot started!');