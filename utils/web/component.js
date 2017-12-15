const fs = require('fs');
const variableRegex = /{{([a-z.])}}/i;
const forRegex = /let ([a-z]+) (in|of) ([a-z.]+)/;
const config = require('../../config');
const Request = require('../request');

/**
 * @param {Component} component 
 * @param {string} html 
 */
function parseIfs(component, html){
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
        component.__if = eval(`(function(){ return ${statement}; })`);
        let fullContent = html.substring(index, endLineEnd);
        if(component.__if()){
            html = html.replace(fullContent, trueContent());
        }
        else{
            html = html.replace(fullContent, falseContent());
        }
        endIf = index;
        delete component.__if;

    }
    return html;
}
/**
 * @param {Component} component 
 * @param {string} html 
 */
function parseFors(component, html){
    let endFor;
    while((endFor = html.indexOf('@endfor')) >= 0){
        let end = endFor + 7;
        let start = html.lastIndexOf('@for', endFor);
        let endStart = html.indexOf('\n', start);
        let statement = html.substring(start + 4, endStart);
        console.log(statement);
        let match = statement.match(forRegex);
        if(!match)
            throw 'Invalid for statement';
        let [fullMatch, varName, loopType, collection] = match;
        let innerLoop = html.substring(endStart + 1, endFor - 1);
        component.__for = eval(`(function(callback){
            for(let item ${loopType} ${collection})
                callback(item);
        })`);
        let replacements = [];
        component.__for(item => {
            replacements.push(innerLoop);
        });
        let fullContent = html.substring(start, end);
        html = html.replace(fullContent, replacements.join('\n'));
        delete component.__for;
        endFor = start;
    }
    return html;
}

/**
 * @param {string[]} string
 * @returns {any}
 */
function interpretStringArr(string, obj){
    if(string.length == 0) throw 'invalid argument. Require atleast one argument';
    if(string.length == 1) return obj[string[0]];
    let [arg, ...other] = string;
    return interpretStringArr(other, obj[arg]);
}
/**
 * @param {string} string 
 * @returns {any}
 */
function interpretString(string, obj){
    let arr = string.split('.');
    return interpretStringArr(arr, obj);
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
        let variableRegex = /{{([a-z\.]+)}}/gi;
        fs.readFile(`${config.websiteDirectory}/templates/${this.getTemplate()}`, {encoding: 'utf8'}, (err, data) => {
            if(err) 
                throw err;
            data = parseFors(this, data);
            data = parseIfs(this, data);
            let m;
            while(m = variableRegex.exec(data)){
                let [match, string] = m;
                let result = interpretString(string, this);
                data = data.replace(match, result.toString())
            }
            callback(data);
        });
    }
}
module.exports = Component;