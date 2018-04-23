import { IncomingMessage } from 'http';
import { Request } from './request';
import Config, { ConfigOptions } from './config';
import { debug, info } from './log';
import { ServerOptions, createServer, Server as HttpsServer } from 'https';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { readFile } from 'fs';

type ServerRequestCallback = (req : Request) => void;

export class Server {
    server: HttpServer | undefined;
    secureServer: HttpsServer | undefined;
    runningSecure: boolean = false;
    runningNormal: boolean = false;
    routes: { [key: string]: ServerRequestCallback } = {};
    constructor() {

    }
    startWithOptions(options: ConfigOptions, onStarted : () => void){
        this.startNormal(options.webPort);
        if(options.key && options.cert){
            let key : string;
            let cert : string;
            let onDone = () => {
                if(key == null || cert == null) return;
                this.startSecure({key,cert, port: options.port});
                onStarted();
            }
            readFile(options.key,{encoding: 'utf8'}, (err, data) => {
                key = data;
                onDone();
            });
            readFile(options.cert, {encoding: 'utf8'}, (err, data)=>{
                cert = data;
                onDone();
            });
        }else{
            onStarted();
        }
    }
    handleRequest(request: Request) {
        let { path, method } = request;
        debug(`[${method}] ${path}`);
        if(this.routes[path]){
            this.routes[path](request);
        }else{
            info('Unknown request at above path!');
        }
    }
    startSecure({key, cert, port} : ServerOptions & {port: number}):void{
        if(this.runningSecure) return;
        let secureServer = createServer({key, cert}, (req, res) => this.handleRequest(new Request(req, res, true, this)));
        secureServer.listen(port);
        this.secureServer = secureServer;
        info(`https server running on port ${port}`);
    }
    startNormal(port : number){
        if(this.runningNormal) return;
        this.runningNormal = true;
        let server = createHttpServer((req, res) => this.handleRequest(new Request(req, res, false, this)));
        server.listen(port);
        this.server = server;
        info(`http server running on port ${port}`);
    }
    registerRoute(route : string, callbackFn : ServerRequestCallback){
        debug(`Route rgistered: [${route}]`);
        this.routes[route] = callbackFn;
    }
}