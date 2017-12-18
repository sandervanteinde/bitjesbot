const server = require('../server');
const log = require('../log');
const fs = require('fs');
const Component = require('./component');
const config = require('../../config');
const Request = require('../request');
class Handler{
    constructor(){
        if(this.constructor === Handler)
            throw 'You can\'t construct a Handler';
    }
    /**
     * @param {Request} request 
     */
    handleRequest(){throw 'The extending class did not inherit handleRequest';}
}
const componentRegex = /<component>.*<\/component>/;
class ComponentParser extends Handler{
    constructor(){
        super();
        let indexLocation = `${config.websiteDirectory}/templates/_index.html`;
        if(fs.existsSync(indexLocation)){
            log.debug('found index file for templates');
            fs.readFile(indexLocation, {encoding: 'utf8'}, (err, data) =>{
                data = data.replace('{{botname}}', config.botName);
                let match = data.match(componentRegex);
                if(!match)
                    throw 'An _index.html template requires a <component></component> tag';
                let [matchString] = match;
                let startIndex = match.index;
                let endIndex = startIndex + matchString.length;
                let scriptsIndex = data.indexOf('@scripts');
                if(scriptsIndex == -1)
                    throw 'An @scripts tag is required for scripts';
                let endScriptsIndex = scriptsIndex + 8;
                this.preScripts = data.substring(0, scriptsIndex);
                this.postScripts = data.substring(endScriptsIndex,startIndex);
                this.postBody = data.substr(endIndex);
            });
        }
    }
    /**
     * 
     * @param {Request} request 
     */
    handleRequest(request){
        /**
         * @type {Component}
         */
        let component = new (require.main.require(request.path))(request);
        request.setResponseStatusCode(200);
        request.setMimeForPath('text/html');
        request.write(this.preScripts);
        this.parseScripts(component.scripts, request)
        request.write(this.postScripts);
        component.writeHTML(request, () => {
            request.write(this.postBody);
            request.success();
        });
    }
    /**
     * @param {string[]} scripts 
     * @param {Request} request
     */
    parseScripts(scripts, request){
        if(!scripts || scripts.length == 0) return;
        scripts.forEach(el => {
            request.write(`<script defer src="${el}"></script>\n`);
        });
    }
}
class FileHandler extends Handler{

    /**
     * @param {Request} request 
     */
    handleRequest(request){
        let path = request.path;
        request.setMimeForPath(path);
        request.setResponseStatusCode(200);
        let stream = fs.createReadStream(path)
            .on('data', chunk => request.write(chunk))
            .on('end', () => request.success());
    }
}
module.exports = {
    ComponentParser: new ComponentParser(),
    FileHandler: new FileHandler()
}