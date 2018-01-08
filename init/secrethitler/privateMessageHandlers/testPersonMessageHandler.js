const PrivateMessageHandler = require('./privateMessageHandler');
const PrivateMessage = require('../privateMessage');
class TestPersonMessageHandler extends PrivateMessageHandler{
    /**
     * 
     * @param {number} testId 
     */
    constructor(testId){
        super();
        this.testId = testId;
    }
    /**
     * @param {PrivateMessage} message 
     */
    sendMessage(message){
        console.log(`Sending private message to ${this.testId}: ${message.message}`);
        let {keyboard, callback} = message;
        if(keyboard){
            console.log('Available keyboard:')
            for(let i = 0; i < keyboard.length; i++)
            {
                let row = keyboard[i];
                for(let j = 0; j < row.length; j++){
                    /**
                     * @type {TelegramInlineKeyboardButton}
                     */
                    let button = row[j];
                    console.log(`${i}/${j}: ${button.text} (${button.callback_data})`);
                }
            }
        }
        if(callback){
            callback({ok: true, result: {message_id: false}});//mock test data?
        }
    }
    editMessage(msgId, message, keyboard){

    }
}
module.exports = TestPersonMessageHandler;