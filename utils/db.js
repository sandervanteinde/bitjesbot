const fs = require('fs');
const debug = require('./debug');

class Database {
    constructor(){
        this.collections = {};
    }
    /**
     * @param {string} name
     * @param {function(Collection):void} callback
     */
    getCollection(name, callback){
        let collection = this.collections[name];
        if(collection){
            callback(collection);
            return;
        }
        collection = new Collection(name);
        this.collections[name] = collection;
        let path = collection.filePath();
        fs.exists(path, exists => {
            if(!exists){ //use default empty array
                callback(collection);
                return;
            }
            //read the database
            fs.readFile(path, (err, data) => {
                collection.items = JSON.parse(data);
                callback(collection);
            });
        });
    }

}
class Collection {
    constructor(name){
        this.items = [];
        this.getName = () => name;
    }
    add(...items){
        items.forEach(item => {
            this.items.push(item);
        });
    }
    saveChanges(){
        debug(`saving collection ${this.getName()}`);
        let filePath = this.filePath();
        fs.writeFile(filePath, JSON.stringify(this.items), {flag: 'w'}, (err) => {
            if(err) throw err;
        });
    }
    filePath(){
        return `./database/${this.getName()}.json`;
    }
    /**
     * @param {number|object} entry The index of the object or an object defining the properties that need to match
     */
    delete(entry){
        if(typeof entry == 'number')
            this.items.splice(entry, 1);
        else
        {
            for(let i = this.items.length - 1; i >= 0; i--){
                let item = this.items[i];
                let isMatch = true;
                for(let prop in entry){
                    if(entry[prop] != item[prop])
                    {
                        isMatch = false;
                        break;
                    }
                }
                if(isMatch)
                    this.items.splice(i, 1);
            }
        }
    }
}

module.exports = new Database();