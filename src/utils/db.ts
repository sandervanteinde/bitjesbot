import { exists, readFile, writeFile } from "fs";
import { debug } from "./log";

export class Database<T> implements Iterable<T>{
    private items : T[] = [];
    constructor(private name: string){

    }
    
    load(callback? : () => void){
        let path = this.filePath();
        exists(path, exists => {
            if(!exists){
                if(callback) callback();
                return;
            }
            readFile(path, {encoding: 'utf8'}, (err, data) => {
                try{
                    this.items = JSON.parse(data);
                }catch(err){
                    this.items = [];
                    this.saveChanges();
                }finally{
                    if(callback)
                        callback();
                }
            });
        });
    }
    saveChanges(){
        debug(`saving collection [${this.name}]`);
        let filePath = this.filePath();
        writeFile(filePath, JSON.stringify(this.items), {flag: 'w'}, (err) => {
            if(err) throw err;
        });
    }
    add(...items: T[]){
        this.items.push(...items);
    }
    delete(entry : T|number){
        if(typeof entry == 'number'){
            this.items.splice(entry, 1);
        }else{
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
    
    filter(callbackFn: (item :T) => boolean ): T[] {
        return this.items.filter(callbackFn);
    }
    firstOrVoid(callbackFn: (item: T) => boolean = (i) => true) : T | void {
        if(!this.items) return;
        for(let item of this.items){
            if(callbackFn(item))
                return item;
        }
    }
    private filePath(){
        return `./database/${this.name}.json`;
    }
    
    [Symbol.iterator](): Iterator<T> {
        let pointer = 0;
        let components = this.items;
    
        return {
          next(): IteratorResult<T> {
            if (pointer < components.length) {
              return {
                done: false,
                value: components[pointer++]
              }
            } else {
              return <any>{
                done: true,
                value: null
              };
            }
          }
        }
    }
}