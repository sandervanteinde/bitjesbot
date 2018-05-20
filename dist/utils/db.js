"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const log_1 = require("./log");
class Database {
    constructor(name) {
        this.name = name;
        this.items = [];
    }
    load(callback) {
        let path = this.filePath();
        fs_1.exists(path, exists => {
            if (!exists) {
                if (callback)
                    callback();
                return;
            }
            fs_1.readFile(path, { encoding: 'utf8' }, (err, data) => {
                try {
                    this.items = JSON.parse(data);
                }
                catch (err) {
                    this.items = [];
                    this.saveChanges();
                }
                finally {
                    if (callback)
                        callback();
                }
            });
        });
    }
    saveChanges() {
        log_1.debug(`saving collection [${this.name}]`);
        let filePath = this.filePath();
        fs_1.writeFile(filePath, JSON.stringify(this.items), { flag: 'w' }, (err) => {
            if (err)
                throw err;
        });
    }
    add(...items) {
        this.items.push(...items);
    }
    delete(entry) {
        if (typeof entry == 'number') {
            this.items.splice(entry, 1);
        }
        else {
            for (let i = this.items.length - 1; i >= 0; i--) {
                let item = this.items[i];
                let isMatch = true;
                for (let prop in entry) {
                    if (entry[prop] != item[prop]) {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch)
                    this.items.splice(i, 1);
            }
        }
    }
    filter(callbackFn) {
        return this.items.filter(callbackFn);
    }
    firstOrVoid(callbackFn = (i) => true) {
        if (!this.items)
            return;
        for (let item of this.items) {
            if (callbackFn(item))
                return item;
        }
    }
    filePath() {
        return `./database/${this.name}.json`;
    }
    [Symbol.iterator]() {
        let pointer = 0;
        let components = this.items;
        return {
            next() {
                if (pointer < components.length) {
                    return {
                        done: false,
                        value: components[pointer++]
                    };
                }
                else {
                    return {
                        done: true,
                        value: null
                    };
                }
            }
        };
    }
}
exports.Database = Database;
//# sourceMappingURL=db.js.map