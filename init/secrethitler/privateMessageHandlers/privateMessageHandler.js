const PrivateMessage = require('../privateMessage');
class PrivateMessageHandler{
    constructor(){
        if(this.constructor === PrivateMessageHandler)
            throw `Can't construct abstract class PrivateMessageHandler. Derive from it instead`;
    }
    /**
     * @param {PrivateMessage} message 
     */
    sendMessage(message){
        
    }
    /**
     * @param {number} msgId 
     * @param {PrivateMessage} message 
     */
    editMessage(msgId, message){

    }
    handleEvent(evName, ...params){
        
    }
}
module.exports = PrivateMessageHandler;