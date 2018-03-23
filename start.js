const loop = require('./utils/loop');
const config = require('./config');

//load init directory
const fs = require('fs');
fs.readdir('./init', (err, files) => {
    files.forEach(file => {
        require(`./init/${file}`);
    });
});

//start the loop
loop.run();