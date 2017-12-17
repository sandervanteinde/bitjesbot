const fs = require('fs');
const forRegex = /let ([a-z]+) (in|of) (.+)/;
const variableRegex = /{{(.+?)}}/gi;
const config = require('../../config');
const Request = require('../request');
const ScopedExecution = require('../scopedexecution');

/**
 * @param {ScopedExecution} scope 
 * @param {string} html 
 */
function parseIfs(scope, html){
    let endIf;
    while((endIf = html.indexOf('@endif', endIf + 1)) >= 0){
        let index = html.lastIndexOf('@if', endIf - 1);
        let endLineIf = html.indexOf('\n', index + 1);
        let statement = html.substring(index + 4, endLineIf);
        if(endIf == -1)
            throw 'Parse error';
        let endLineEnd = endIf + 6;
        let els = html.indexOf('@else', endLineIf + 1);
        let trueContent;
        let falseContent;
        if(els != -1 && els < endIf){
            let endLineEls = els + 5;
            trueContent = () => html.substring(endLineIf + 1, els);
            falseContent = () => html.substring(endLineEls + 1, endIf);
        }else{
            trueContent = () => html.substring(endLineIf + 1, endIf);
            falseContent = () => '';
        }
        let result = scope.execute(statement);
        let fullContent = html.substring(index, endLineEnd);
        if(result){
            html = html.replace(fullContent, trueContent());
        }
        else{
            html = html.replace(fullContent, falseContent());
        }
        endIf = index;
    }
    return html;
}
/**
 * @param {ScopedExecution} scope 
 * @param {string} html 
 */
function parseFors(scope, html){
    let endFor = html.lastIndexOf('@endfor');
    if(endFor == -1) return html;
    let end = endFor + 7;
    let start = html.indexOf('@for');
    let endStart = html.indexOf('\n', start);
    let statement = html.substring(start + 4, endStart);
    let match = statement.match(forRegex);
    if(!match)
        throw 'Invalid for statement';
    let [fullMatch, varName, loopType, collection] = match;
    console.log(varName, collection);
    let innerLoop = html.substring(endStart + 1, endFor - 1);
    scope.__for = eval(`(function(callback){
        let __i = 0;
        for(let item ${loopType} ${collection})
            callback(item, __i++);
    })`);
    let replacements = [];
    scope.__for((item, i) => {
        scope.addToScope(varName, item);
        replacements.push(parseHTML(scope, innerLoop));
        scope.removeFromScope(varName, item);
    });
    let fullContent = html.substring(start, end);
    html = html.replace(fullContent, replacements.join('\n'));
    delete scope.__for;
    endFor = start;
    return html;
}
/**
 * 
 * @param {ScopedExecution} scope 
 * @param {string} html 
 */
function parseVariables(scope, html){
    let m;
    while(m = variableRegex.exec(html)){
        let [match, string] = m;
        let result = scope.execute(string);
        html = html.replace(match, result && result.toString() || '');
    }
    return html;
}
/**
 * @param {ScopedExecution} scope 
 * @param {string} html 
 */
function parseHTML(scope, html){
    return parseVariables(scope, parseIfs(scope, parseFors(scope, html)));
}
class Component{
    constructor(){
        if(this.constructor === Component)
            throw 'Can\'t construct a Component. Derive a type from Component instead!';
        /**
         * @type {string[]}
         */
        this.scripts = [];
    }
    /**
     * @returns {string}
     */
    getTemplate(){
        throw 'Extending class did not implement getTemplate()';
    }
    /**
     * @param {Request} request
     * @param {function(string):void} callback 
     */
    parseHTML(request, callback){
        this.telegramLink = request.cookies.key;
        fs.readFile(`${config.websiteDirectory}/templates/${this.getTemplate()}`, {encoding: 'utf8'}, (err, data) => {
            let scope = new ScopedExecution(this);
            scope.setScope();
            data = parseHTML(scope, data);
            scope.unsetScope();
            if(err) 
                throw err;
            callback(data);
        });
    }
}
module.exports = Component;