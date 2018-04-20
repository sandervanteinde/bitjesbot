const loop = require('./utils/loop');
const config = require('./config');
const server = require('./utils/server');
const fs = require('fs');

//load init directory
fs.readdir('./init', (err, files) => {
    files.forEach(file => {
        require(`./init/${file}`);
    });
});

server.startNormal(config.webPort);
if(config.key && config.cert)
{
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


//start the loop
loop.run();
