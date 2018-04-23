import { IncomingMessage } from "http";

class BodyParser{
    parseBody(incomingMessage: IncomingMessage, callback: (arg0: string) => void){
        let body = ''
        incomingMessage.on('data', chunk => {
            body += chunk;
        }).on('end', () => {
            if(callback)
                callback(body);
        });
    }
    parseJson<T>(incomingMessage: IncomingMessage, callback: (arg0: T) => void){
        this.parseBody(incomingMessage, msg => {
            if(callback)
                callback(<T>JSON.parse(msg));
        });
    }
}
export default new BodyParser();