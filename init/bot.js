const loop = require('../utils/loop');
const https = require('https');
const config = require('../config');
const bodyparser = require('../utils/bodyparser');
const keyboard = require('../utils/keyboard');
let slashCommands = {};

let polling = false;
let lastMessage = 0;
let url = `bot${config.API_KEY}`;

/**
 * @param {string} command
 * @param {string} help
 * @param {function} callback 
 */
function registerSlashCommand(command, help, callback){
    if(slashCommands[command])
        error('A command with the name ' + command + 'already exists!');
    slashCommands[command] = {help, callback};
}
/**
 * @param {number} chatId 
 * @param {string} message 
 * @param {number} replyId
 */
function sendMessage({chatId, message, callback = null, keyboard = [], replyId = null}){
    let options = {
        chat_id: chatId,
        text: message
    };
    if(replyId !== null)
        options.reply_to_message_id = replyId;
    if(keyboard.length > 0)
        options.reply_markup = {inline_keyboard: keyboard};
    callApiMethod('sendMessage', options, callback);
}

/**
 * @param {string} method 
 * @param {object} body 
 * @param {function} callBack 
 */
function callApiMethod(method, body = null, callBack){
    let postOptions = {
        host: 'api.telegram.org',
        path: `/${url}/${method}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 5000
    };
    let request = https.request(postOptions, (res) => bodyparser.parseJson(res, body => {
        if(!body.ok)
            console.error('Invalid message sent!', body);
        if(callBack)
            callBack(body);
    }));
    request.on('error', err => {
        polling = false;
        console.error(err);
    });
    if(body){
        request.write(JSON.stringify(body));
    }
    request.end();
}
function sendUnknownCommand(msg){
    sendMessage({chatId: msg.chat.id, message: 'Unknown command. Type /help for commands!'});
}
function processTextMessage(msg){
    let [command, ...args] = msg.text.split(' ');
    if(command[0] != '/') return; // we do not handle slash commands
    command = command.substring(1);
    let callback = slashCommands[command];
    if(callback){
        callback.callback(msg, command, ...args);
    }else{
        sendUnknownCommand(msg);
    }
}
function processMessage(msg){
    if(msg.text)
        processTextMessage(msg);
    else
        sendUnknownCommand(msg);
}
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
function helpCallback(msg){
    commands = [];
    for(let slashCommand in slashCommands){
        commands.push(`/${slashCommand} - ${slashCommands[slashCommand].help}`);
    }
    let sendMsg = `Available commands:\n\n${commands.join('\n')}`;
    sendMessage({chatId: msg.chat.id, message: sendMsg});
}
function answerCallbackQuery(id, {callback = null} = {}){
    callApiMethod('answerCallbackQuery', {callback_query_id: id}, callback);
}
/**
 * 
 * @param {number} chat_id 
 * @param {number} message_id 
 * @param {string} text 
 */
function editMessage(chat_id, message_id, text, {keyboard = null} = {}){
    let options = {chat_id, message_id, text};
    if(keyboard !== null)
        options.reply_markup = {inline_keyboard: keyboard};
    callApiMethod('editMessageText', options);
}

loop.subscribe(pollMessage);
registerSlashCommand('help', 'This command', helpCallback)

module.exports = {
    sendMessage,
    registerSlashCommand,
    answerCallbackQuery,
    editMessage
};
console.log('Bot started!');