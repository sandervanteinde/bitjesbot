const loop = require('./utils/loop');
const config = require('./config');
const server = require('./utils/server');
const log = require('./utils/log');

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
    server.startNormal(80);
    if(config.key && config.cert)
    {
        log.debug('Loading key and certificates');
        let key = null;
        let cert = null;
        let onDone = () => {
            if(key == null || cert == null) return;
            
            server.startSecure({key,cert, port: config.port});
        }
        fs.readFile(config.key,{encoding: 'utf8'}, (err, data) => {
            key = data;
            onDone();
        });
        fs.readFile(config.cert, {encoding: 'utf8'}, (err, data)=>{
            cert = data;
            onDone();
        });
    }
}

//start the loop
loop.run();