import { IncomingMessage, ServerResponse } from "http";
import { Server } from './server';

export class Request {
    get path(): string  {
        return <string>this.request.url;
    }
    get method(): string  {
        return <string>this.request.method;
    }
    constructor(
        private request: IncomingMessage,
        private response: ServerResponse,
        private isSecure: boolean,
        private server: Server
    ) {
    }
    
    success(data? : any, {mime} : {mime?: string} = {}): any {
        this.response.statusCode = 200;
        if(mime)
            this.response.setHeader('Content-Type', mime);
        if(data)
            this.write(data);
        this.response.end();
    }
    write(data: any){
        this.response.write(data);
    }
    asString(callback: (str : string)=> void){
        let body = '';
        this.request.on('data', chunk => {
            body += chunk;
        }).on('end', () => {
            callback(body);
        });
    }
    asObject<T>(callback: (obj : T) => void) {
        this.asString(str => callback(<T>JSON.parse(str)));
    }
}