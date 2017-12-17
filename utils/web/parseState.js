const Request = require('../request');
const ScopedExecution = require('../scopedexecution');
const forRegex = /let ([a-z]+) (in|of) (.+)/;
class ParseState{
    /**
     * @param {Request} request 
     * @param {ScopedExecution} scope
     */
    constructor(request, scope){
        if(this.constructor === ParseState)
            throw 'Can\'t construct a ParseState object. Derive from it instead!';
        this.request = request;
        this.scope = scope;
    }
    /**
     * @param {string} string 
     * @param {Request} request 
     */
    onInput(string, request){
        throw 'Override the onInput method in the deriving class!';
    }
    onEndState(){

    }
    /**
     * @param {ParseState} state 
     */
    onChildState(state){

    }
    /**
     * @param {ParseState} state 
     */
    onChildStateDone(state){
        state.execute();
    }
    execute(){

    }
}
class ReadWrite extends ParseState{
    constructor(request, scope){
        super(request, scope);
    }
    /**
     * @param {string} string 
     * @param {Request} request 
     */
    onInput(string){
        this.request.write(string);
    }
}
class For extends ParseState{
    
    constructor(request, scope){
        super(request, scope);
        this.state = 0;
        this.statement = '';
        this.body = [''];
        this.index = 0;
    }
    /**
     * @param {string} string 
     */
    onInput(string){
        switch(this.state){
            case 0:
                if(string == '\n')
                    this.state = 1;
                else
                    this.statement += string;
                break;
            case 1:
                this.body[this.index] += string;
                break;
        }
    }
    onEndState(){
    }
    onChildStateDone(state){
        this.body.push(state);
        this.body.push('');
        this.index = this.body.length - 1;
    }
    execute(){
        let body = this.body;
        let match = this.statement.match(forRegex);
        if(!match)
            throw 'invalid for statement.';
        let [, varName, loopType, collection] = match;
        let theCollection = this.scope.execute(collection);
        let callback = (item) => {
            this.scope.addToScope(varName, item);
            for(let i = 0; i < body.length; i++){
                let entry = this.body[i];
                if(entry instanceof ParseState)
                    entry.execute();
                else
                    this.request.write(entry);
            }
            this.scope.removeFromScope(varName);
        };
        if(loopType == 'of')
            for(let entry of theCollection)
                callback(entry);
        else
            for(let entry in theCollection)
                callback(entry);
    }
}
class Variable extends ParseState{
    constructor(request, scope){
        super(request, scope);
        this.statement = '';
    }
    onInput(string){
        this.statement += string;
    }
    onEndState(){

    }
    execute(){
        this.request.write((this.scope.execute(this.statement) || '').toString());
    }
}
class If extends ParseState{
    constructor(request, scope){
        super(request, scope);
        this.state = 0;
        this.statement = '';
        this.trueValue = [''];
        this.falseValue = [''];
        this.index = 0;
    }
    onInput(string){
        switch(this.state){
            case 0: //getting statement
                if(string == '\n')
                    this.state = 1; //if
                else
                    this.statement += string;
                    break;
            case 1: //body if-endif or if-else
                this.trueValue[this.index] += string;
                break;
            case 2: //body else-endif
                this.falseValue[this.index] += string;
                break;
        }
    }
    onEndState(string){

    }
    onChildStateDone(state){
        switch(this.state){
            case 1:
                this.trueValue.push(state);
                this.trueValue.push('');
                this.index = this.trueValue.length - 1;
                break;
            case 2:
                this.falseValue.push(state);
                this.falseValue.push('');
                this.index = this.falseValue.length - 1;
                break;
        }
    }
    startElseStatement(){
        this.state = 2;
    }
    execute(){
        let arr;
        if(this.scope.execute(this.statement)){
            arr = this.trueValue;
        }else{
            arr = this.falseValue;
        }
        for(let i = 0; i < arr.length; i++)
        {
            let entry = arr[i];
            if(entry instanceof ParseState)
                entry.execute();
            else
                this.request.write(entry);
        }
    }
}

module.exports = {
    ReadWrite,
    For,
    If,
    Variable ,
    ParseState 
}