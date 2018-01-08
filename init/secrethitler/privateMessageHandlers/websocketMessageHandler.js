const PrivateMessageHandler = require('./privateMessageHandler');
const ws = require('../../../utils/web/websocket');
const PrivateMessage = require('../privateMessage');

class WebSocketMessageHandler extends PrivateMessageHandler{
    constructor(websocket){
        super();
        this.websocket = websocket;
        this.messageId = 0;
    }
    /**
     * 
     * @param {PrivateMessage} message 
     */
    sendMessage(message){
        ws.send(this.websocket, 'sh_private_message', {
            message: message.message,
            keyboard: message.keyboard,
            identifier: message.identifier,
            data: message.data,
            messageId: ++this.messageId
        });
        if(message.callback)
            message.callback({ok: true, result: {message_id: this.messageId}});//mock test data?
    }
    editMessage(msgId, message){

    }
    handleEvent(event, ...params){
        ws.send(this.websocket, `sh_${event}`, ...params);
    }
}
module.exports = WebSocketMessageHandler;