const fs = require('fs');
const forRegex = /let ([a-z]+) (in|of) (.+)/;
const variableRegex = /{{(.+?)}}/gi;
const config = require('../../config');
const Request = require('../request');
const ScopedExecution = require('../scopedexecution');
const KeywordFinder = require('../keywordfinder');
const ParseStates = require('./parseState');
const Stack = require('../stack');
const finder = new KeywordFinder('@if', '@endif', '@endfor', '@for', '@else', '{{', '}}');
/**
 * 
 * @param {ScopedExecution} scope 
 * @param {StreamReader} reader 
 * @param {Request} request 
 * @param {function():void} onComplete
 */
function writeHTML(scope, reader, request, onComplete){
    let stack = new Stack();
    stack.push(new ParseStates.ReadWrite(request, scope));
    /**
     * @type {ParseStates.ParseState}
     */
    let top = stack.peek();
    finder.reset();
    finder.onFalsePositive = (str) => {
        top.onInput(str);
    };
    reader.on('close', () => {
        if(!(top instanceof ParseStates.ReadWrite))
            throw `Invalid end state of parser. Expected end state to be ReadWrite, but is ${top.constructor.name}`
        finder.onFalsePositive = undefined;
        if(onComplete)
            onComplete();
    });
    reader.on('data', chunk => {
        request.chunk = chunk;
        for(let i = 0; i < chunk.length; i++){
            let keyWord = finder.onInput(chunk[i]);
            if(keyWord){
                let state = undefined;
                let start = i - keyWord.length;
                switch(keyWord){
                    case '{{':
                        state = new ParseStates.Variable(request, scope);
                        stack.push(state);
                        top.onChildState(state, start + 1);
                        break;
                    case '}}':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.Variable))
                            throw 'Invalid state! Expected a Variable state to end }}';
                        state.onStateDone(start + 1);
                        stack.peek().onChildStateDone(state, i + 1);
                        break;
                    case '@if':
                        state = new ParseStates.If(request, scope);
                        stack.push(state);
                        top.onChildState(state, start + 1);
                        break;
                    case '@else':
                        state = stack.peek();
                        if(!(state instanceof ParseStates.If))
                            throw 'Invalid state! Expected a if state to add @else';
                        state.startElseStatement(start + 1);
                        break;
                    case '@endif':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.If))
                            throw 'Invalid state! Expected a if state to end @if';
                        state.onStateDone(start + 1);
                        stack.peek().onChildStateDone(state, i + 1);
                        break;
                    case '@for':
                        state = new ParseStates.For(request, scope);
                        stack.push(state);
                        top.onChildState(state, start + 1);
                        break;
                    case '@endfor':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.For))
                            throw 'Invalid state! Expected a for state to end @endfor';
                        state.onStateDone(start + 1);
                        stack.peek().onChildStateDone(state, i + 1);
                        break;
                }
                top = stack.peek();
            }
            else if(!finder.isFindingKeyword){
                top.onInput(chunk[i], i);
            }
        }
        delete request.chunk;
    });
}
class Component{
    /**
     * @param {Request} request 
     */
    constructor(request){
        if(this.constructor === Component)
            throw 'Can\'t construct a Component. Derive a type from Component instead!';
        /**
         * @type {string[]}
         */
        this.scripts = [];
        this.telegramLink = request.cookies.key;
    }
    /**
     * @returns {string}
     */
    getTemplate(){
        throw 'Extending class did not implement getTemplate()';
    }
    /**
     * @param {Request} request
     * @param {function():void} onComplete
     */
    writeHTML(request, onComplete){
        let scope = new ScopedExecution(this);
        scope.setScope();
        let stream = fs.createReadStream(`${config.websiteDirectory}/templates/${this.getTemplate()}`, {encoding: 'utf8'});
        writeHTML(scope, stream, request, onComplete);
    }
}
module.exports = Component;