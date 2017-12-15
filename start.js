const loop = require('./utils/loop');
const config = require('./config');
const server = require('./utils/server');
const log = require('./utils/log');
const ws = require('./utils/web/websocket');

//load init directory
const fs = require('fs');
fs.readdir('./init', (err, files) => {
    files.forEach(file => {
        require(`./init/${file}`);
    });
});

//Configure website if enabled
if(config.enableWebsite || config.domain){
    if(config.domain && (!config.key || !config.cert))
        throw 'A key and certificate is required for webhooks!';
    server.startNormal(config.webPort);
    if(config.key && config.cert)
    {
        let key = null;
        let cert = null;
        let onDone = () => {
            if(key == null || cert == null) return;
            
            server.startSecure({key,cert, port: config.port});
            ws.start(8000, key, cert);
        }
        fs.readFile(config.key,{encoding: 'utf8'}, (err, data) => {
            key = data;
            onDone();
        });
        fs.readFile(config.cert, {encoding: 'utf8'}, (err, data)=>{
            cert = data;
            onDone();
        });
    }else{
        ws.start(8000);
    }

}

//start the loop
loop.run();