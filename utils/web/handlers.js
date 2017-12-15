const server = require('../server');
const log = require('../log');
const fs = require('fs');
const Component = require('./component');
const config = require('../../config');
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
const componentRegex = /<component>(.*)<\/component>/;
class ComponentParser extends Handler{
    constructor(){
        super();
        let indexLocation = `${config.websiteDirectory}/templates/_index.html`;
        if(fs.existsSync(indexLocation)){
            log.debug('found index file for templates');
            fs.readFile(indexLocation, {encoding: 'utf8'}, (err, data) =>{
                if(!data.match(ComponentParser.componentRegex))
                    throw 'A _index.html template requires a <component></component> tag';
                this.index = data.replace('{{botname}}', config.botName);
            });
        }
    }
    handleRequest(request){
        /**
         * @type {Component}
         */
        let component = new (require.main.require(request.getPath()))(request);
        component.parseHTML(request, html => {
            if(this.index){
                html = this.index.replace(componentRegex, html);
                html = html.replace('@scripts', this.parseScripts(component.scripts));
            }
            request.success(html);
        });
    }
    /**
     * @param {string[]} scripts 
     * @returns {string}
     */
    parseScripts(scripts){
        if(!scripts || scripts.length == 0) return '';
        let asScript = [];
        scripts.forEach(el => {
            asScript.push(`<script defer src="${el}"></script>`);
        });
        return asScript.join('\n');
    }
}
class FileHandler extends Handler{

    /**
     * @param {Request} request 
     */
    handleRequest(request){
        fs.readFile(request.getPath(), (err, buffer)=> {
            if(err) throw err;
            request.success(buffer);
        });
    }
}
module.exports = {
    ComponentParser: new ComponentParser(),
    FileHandler: new FileHandler()
}