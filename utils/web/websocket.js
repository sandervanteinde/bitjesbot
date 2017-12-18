const ws = require('nodejs-websocket');
const log = require('../log');
const connect = require('../telegramconnect');
const config = require('../../config');
const bot = require('../../init/bot');
const fs = require('fs');
class WebSocketHandler{
    constructor(){
        this.running = false;
        this.connections = [];
        /**
         * @type {Object.<string,function>}
         */
        this.callbacks = {};
        this.registerCallback('requestTelegramKey', (conn, obj) => this.sendConnectKey(conn, obj));
        this.registerCallback('cancelTelegramKey', (conn, guid) => connect.cancelGUID(guid));
        this.registerCallback('removeTelegramKey', (conn, empty, key) => connect.removeKey(key));

        bot.registerSlashCommand('start', null, (msg, slashCmd, key) => {
            log.debug(`attempting to link guid ${key}`);
            let connection = connect.getConnectionFromGUID(key);
            if(connection)
                this.send(connection, 'telegramlink', connect.createLinkForUserId(msg.from.id));
        });
    }
    sendConnectKey(connection, obj){
        let key = connect.getGUID(connection);
        this.send(connection, 'telegramKey', key);
    }
    send(connection, id, content){
        connection.send(JSON.stringify({id, content}))
    }
    start(port, key, cert){
        if(this.running) return;
        this.running = true;
        let options = {secure: Boolean(key), validProtocols: ['ws:']};
        if(options.secure)
        {
            options.validProtocols.push('wss:');
            options.cert = cert;
            options.key = key;
        }
        let server = ws.createServer(options,conn => {
            this.connections[conn] = true;
            conn.on('text', text => this.textReceived(conn, text));
            conn.on('close', (code, reason) => {
                log.debug('websocket closing');
                this.connectionClosed(conn, code, reason);
            });
            conn.on('error', (err) => {
                this.connectionClosed(conn);
            });
        });
        server.on('listening', () => log.debug(`websocket listening on port ${port}`));
        server.listen(port);
        

    }
    textReceived(connection, text){
        log.debug('websocket msg received:', text);
        let obj = JSON.parse(text);
        let callback = this.callbacks[obj.id];
        if(callback)
            callback(connection, obj.content, obj.key);
    }
    connectionClosed(connection, code, reason){
        if(this.connections[connection])
            delete this.connections[connection];
    }
    registerCallback(key, callback){
        this.callbacks[key] = callback;
    }
}
module.exports = new WebSocketHandler();