const Component = require('../utils/web/component');
const reminderutil = require('../init/reminderutil');
const Request = require('../utils/request');
const connect = require('../utils/telegramconnect');
class BitjesBot extends Component{

    /**
     * @param {Request} request 
     */
    constructor(request){
        super(request);
        this.scripts.push('js/bitjesbot.js');
        let key = request.cookies.key;
        if(key){
            console.log('key', key);
            let id = connect.getIdFromGUID(key);
            if(!id){
                request.setCookie('key', null);
                delete this.telegramLink;
            }
            this.reminders = reminderutil.getRemindersForId(id);
        }else{
            this.reminders = [];
        }
        console.log(this.reminders);
        this.pending = reminderutil.pendingRequests;
    }
    getTemplate(){
        return 'bitjesbot.html';
    }
}
module.exports = BitjesBot;