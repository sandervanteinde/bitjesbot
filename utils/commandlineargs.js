const config = require('../config');
let [nodePath, startFile, ...args] = process.argv;
const webhookMatch = /-([a-z]+)=(['"])?(.+)\1?/i;
args.forEach(v => {
    let match = v.match(webhookMatch);
    if(!match)
        return;
    let [fullMatch, key, stringSep, value] = match;
    if(config[key] !== undefined)
    config[key] = value;
});