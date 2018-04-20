import { readFileSync } from "fs";
export interface ConfigOptions{
    API_KEY: string,
    key: string,
    cert: string,
    loggingLevel : number,
    webPort: number,
    botName: string,
    weatherSecret: string,
    googleMapsKey: string,
    port: number,
    domain: string
}
class Config{
    constructor(private options : ConfigOptions){

    }
    get Options(){ return this.options; }
}
let jsonString = readFileSync('./config.json', {encoding: 'utf8'});
let json = JSON.parse(jsonString);
export default new Config(json).Options;