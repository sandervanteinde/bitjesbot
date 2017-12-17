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
 */
function writeHTML(scope, reader, request){
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
    reader.on('done', () => {
        if(!(top instanceof ParseStates.ReadWrite))
            throw `Invalid end state of parser. Expected end state to be ReadWrite, but is ${top.constructor.name}`
        finder.onFalsePositive = undefined;
    });
    reader.on('data', chunk => {
        for(let i = 0; i < chunk.length; i++){
            let keyWord = finder.onInput(chunk[i]);
            if(keyWord){
                let state = undefined;
                let result = undefined;
                switch(keyWord){
                    case '{{':
                        state = new ParseStates.Variable(request, scope);
                        stack.push(state);
                        top.onChildState(state);
                        break;
                    case '}}':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.Variable))
                            throw 'Invalid state! Expected a Variable state to end }}';
                        result = state.onEndState();
                        stack.peek().onChildStateDone(state);
                        break;
                    case '@if':
                        state = new ParseStates.If(request, scope);
                        stack.push(state);
                        top.onChildState(state);
                        break;
                    case '@else':
                        state = stack.peek();
                        if(!(state instanceof ParseStates.If))
                            throw 'Invalid state! Expected a if state to add @else';
                        state.startElseStatement();
                        break;
                    case '@endif':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.If))
                            throw 'Invalid state! Expected a if state to end @if';
                        result = state.onEndState();
                        stack.peek().onChildStateDone(state);
                        break;
                    case '@for':
                        state = new ParseStates.For(request, scope);
                        stack.push(state);
                        top.onChildState(state);
                        break;
                    case '@endfor':
                        state = stack.pop();
                        if(!(state instanceof ParseStates.For))
                            throw 'Invalid state! Expected a for state to end @endfor';
                        result = state.onEndState();
                        stack.peek().onChildStateDone(state);
                        break;
                }
                top = stack.peek();
                if(result)
                    top.onInput(result);
            }
            else if(!finder.isFindingKeyword){
                top.onInput(chunk[i]);
            }
        }
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
        writeHTML(scope, stream, request);
        stream.on('close', onComplete);
    }
}
module.exports = Component;