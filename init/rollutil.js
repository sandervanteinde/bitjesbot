
const bot = require('./bot');
const dndStyleRoll = /(\d+)d(\d+)/i;

class RollUtils{
    constructor(){
        bot.registerSlashCommand('roll', 'Rolls a dice.', (...args) => this.onSlashCommand(...args));
    }
    /**
     * 
     * @param {TelegramMessage} message 
     * @param {string} slashCmd
     * @param {string} param
     */
    onSlashCommand(message, slashCmd, param = '6'){
        let matches = param.match(dndStyleRoll);
        if(matches){
            return this.handleDndRoll(message, matches);
        }
        else{
            let num = Number(param);
            if(!num){
                return bot.sendMessage({chatId: message.chat.id, message: 'Invalid parsed /roll'});
            }
            else{
                let roll = Math.round(Math.random() * num + 0.5);
                return bot.sendMessage({chatId: message.chat.id, message: `Roll a ${param}-sized dice:\nRolled: ${roll}`, replyId: message.message_id});
            }
        }
    }
    /**
     * @param {TelegramMessage} message 
     * @param {RegExpMatchArray} param
     */
    handleDndRoll(message, param){
        let amountOfDice = Number(param[1]);
        let diceSize = Number(param[2]);
        let returnMessage;
        let totalRoll = 0;
        if(amountOfDice > 10000){
            return bot.sendMessage({chatId: message.chat.id, message:'The maximum amount of dice are 10.000.', replyId: message.message_id});
        }
        if(diceSize > 10000){
            return bot.sendMessage({chatId: message.chat.id, message:'The maximum amount dice size is 10.000.', replyId: message.message_id});
        }
        if(amountOfDice > 20){
            for(let i = 0; i < amountOfDice; i++)
            {
                let roll = Math.round(Math.random() * diceSize + 0.5);
                totalRoll += roll;
                returnMessage = `Total roll: ${totalRoll}`;
            }
        }
        else{
            returnMessage = '';
            for(let i = 0; i < amountOfDice; i++){
                let roll = Math.round(Math.random() * diceSize + 0.5);
                totalRoll += roll;
                returnMessage = `${returnMessage}${i == 0 ? '' : '\n'}Roll ${i + 1}: ${roll}`;
            }
            returnMessage = `${returnMessage}\n\nTotal roll: ${totalRoll}`;
        }
        bot.sendMessage({chatId: message.chat.id, message: returnMessage, replyId: message.message_id});
    }
}
module.exports = new RollUtils();