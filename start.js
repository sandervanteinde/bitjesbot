const loop = require('./utils/loop');

//load init directory
const fs = require('fs');
fs.readdir('./init', (err, files) => {
    files.forEach(file => {
        require(`./init/${file}`);
    });
});

loop.run();