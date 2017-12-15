const Component = require('../utils/web/component');
const reminderutil = require('../init/reminderutil');
const Request = require('../utils/request');
const connect = require('../utils/telegramconnect');
class BitjesBot extends Component{

    /**
     * @param {Request} request 
     */
    constructor(request){
        super();
        this.scripts.push('js/bitjesbot.js');
        let key = request.cookies.key;
        if(key){
            let id = connect.getIdFromGUID(key);
            this.reminders = [];
        }else{
            this.reminders = [];
        }
    }
    get pending(){
        return reminderutil.pendingRequests;
    }
    getTemplate(){
        return 'bitjesbot.html';
    }
}
module.exports = BitjesBot;