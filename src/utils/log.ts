import config from "./config";

export function debug(...params : any[]){
    if(config.loggingLevel <= 1){
        console.log(...params);
    }
}
export function info(...params : any[]){
    console.log(...params);
}