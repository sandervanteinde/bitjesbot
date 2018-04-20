const db = require('./db');
class TelegramConnect{
    constructor(){
        this.requestGUIDs = {};
        this.linkGUIDs = {};
        db.getCollection('telegramlinks', (coll) => {
            this.collection = coll;
            coll.items.forEach(entry => {
                this.linkGUIDs[entry.guid] = entry.id;
            });
        });
    }
    cancelGUID(guid){
        if(this.requestGUIDs[guid])
            delete this.requestGUIDs[guid];
    }
    removeKey(key){
        delete this.linkGUIDs[key];
        db.getCollection('telegramlinks', (coll) => {
            coll.delete({guid: key});
            coll.saveChanges();
        });
    }
    /**
     * 
     */
    getGUID(connection){
        while(true){
            let str = this.generateGUID();
            if(!this.requestGUIDs[str]){
                this.requestGUIDs[str] = connection;
                return str;
            }
        }
    }
    /**
     * @returns {string}
     */
    generateGUID(){
        
        let _sym = 'abcdefghijklmnopqrstuvwxyz1234567890';
        let str = '';

        for(var i = 0; i < 30; i++) {
            str += _sym[parseInt(Math.random() * (_sym.length))];
        }
        return str;
    }
    /**
     * @param {string} guid
     * @returns {Connection}
     */
    getConnectionFromGUID(guid){
        let entry = this.requestGUIDs[guid];
        if(!entry) return null;
        delete this.requestGUIDs[guid];
        return entry;
    }
    /**
     * @param {number} id 
     */
    createLinkForUserId(id){
        let guid
        do{
            guid = this.generateGUID();
        }while(this.linkGUIDs[guid]);
        this.linkGUIDs[guid] = id;
        this.collection.add({guid, id});
        this.collection.saveChanges();
        return guid;
    }
    getIdFromGUID(guid){
        return this.linkGUIDs[guid];
    }
}

module.exports = new TelegramConnect();