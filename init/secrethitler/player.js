const Role = require('./role');
const PrivateMessageHandler = require('./privateMessageHandlers/privateMessageHandler');
class Player{
    /**
     * @param {PrivateMessageHandler} messageHandler 
     */
    constructor(messageHandler, {id, first_name, last_name, username} = {}){
        /**
         * @type {number}
         */
        this.id = id;
        /**
         * @type {string}
         */
        this.first_name = first_name;
        /**
         * @type {string}
         */
        this.last_name = last_name;
        /**
         * @type {string}
         */
        this.username = username;
        /**
         * @type {number}
         */
        this.seat = -1;
        /**
         * @type {Role}
         */
        this.role = undefined;
        /**
         * @type {boolean}
         */
        this.alive = true;
        /**
         * @type {boolean}
         */
        this.confirmedNotHitler = false;
        /**
         * @type {PrivateMessageHandler}
         */
        this.privateMessageHandler = messageHandler;
    }
    toJSON(){
        let obj = {};
        for(let field in this){
            if(field == 'privateMessageHandler' || field == 'role') continue;
            obj[field] = this[field];
        }
        return obj;
    }
}
module.exports = Player;