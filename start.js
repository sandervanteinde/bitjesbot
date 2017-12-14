const loop = require('./utils/loop');
const config = require('./config');
const server = require('./utils/server');

//load init directory
const fs = require('fs');
fs.readdir('./init', (err, files) => {
    files.forEach(file => {
        require(`./init/${file}`);
    });
});
loop.run();
if(config.enableWebsite || config.webhook){
    if(config.webhook && (!config.key || !config.cert))
        throw 'A key and certificate is required for webhooks!';
    server.startNormal(80);
    if(config.key && config.cert)
        server.startSecure({
            key: fs.readFileSync(config.key, 'utf8'), 
            cert: fs.readFileSync(config.cert, 'utf8'),
            port
        });
}