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
     * @param {number} index
     */
    onInput(string, index){
        throw 'Override the onInput method in the deriving class!';
    }
    /**
     * @param {ParseState} state 
     */
    onChildState(state){

    }
    /**
     * @param {number} index 
     */
    onStateDone(index){

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
     * @param {number} index 
     */
    onInput(string, index){
        this.request.write(string);
    }
}
class For extends ParseState{
    
    constructor(request, scope){
        super(request, scope);
        this.state = 0;
        this.statement = {start: -1, end: -1};
        this.body = [{start: -1, end: -1}];
        this.index = 0;
    }
    /**
     * @param {string} string
     * @param {number} index
     */
    onInput(string, index){
        switch(this.state){
            case 0:
                if(this.statement.start == -1)
                    this.statement.start = index;
                else if(string == '\n'){
                    this.statement.end = index;
                    this.state = 1;
                }
                break;
            case 1:
                let obj = this.body[this.index];
                if(obj.start == -1)
                    obj.start = index;
                break;
        }
    }
    onChildState(state, index){
        let obj = this.body[this.index];
        obj.end = index;
    }
    onChildStateDone(state, index){
        this.body.push(state);
        this.body.push({start: index});
        this.index = this.body.length - 1;
    }
    onStateDone(index){
        let obj = this.body[this.index];
        obj.end = index;
    }
    execute(){        
        let body = this.body;
        let match = this.request.chunk.substring(this.statement.start, this.statement.end).match(forRegex);
        if(!match)
            throw 'invalid for statement.';
        let [, varName, loopType, collection] = match;
        let theCollection = this.scope.execute(collection);
        for(let i = 0; i < body.length; i++){
            let entry = body[i];
            if(!(entry instanceof ParseState)){
                let content = null; //lazy load the content
                body[i] = () => {
                    if(!content)
                        content = this.request.chunk.substring(entry.start, entry.end);
                    return content;
                };
            }
        }
        let callback = (item) => {
            this.scope.addToScope(varName, item);
            for(let i = 0; i < body.length; i++){
                let entry = body[i];
                if(entry instanceof ParseState)
                    entry.execute();
                else
                    this.request.write(entry());
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
        this.statement = {start: -1, end: -1, string: undefined};
    }
    onInput(string, index){
        if(this.statement.start == -1)
            this.statement.start = index;
    }
    onStateDone(index){
        this.statement.end = index;
    }
    execute(){
        let statement = this.statement;
        if(!statement.string){
            statement.string = this.request.chunk.substring(statement.start, statement.end);
        }
        this.request.write((this.scope.execute(statement.string) || '').toString());
    }
}
class If extends ParseState{
    constructor(request, scope){
        super(request, scope);
        this.state = 0;
        this.statement = {start: -1, end: -1, string: undefined};
        this.trueValue = [{start: -1, end: -1, string: undefined}];
        this.falseValue = [{start: -1, end: -1, string: undefined}];
        this.index = 0;
    }
    onInput(string, index){
        let statement;
        switch(this.state){
            case 0: //getting statement
                if(this.statement.start == -1)
                    this.statement.start = index;
                else if(string == '\n'){
                    this.statement.end = index;
                    this.state = 1; //if
                }
                break;
            case 1: //body if-endif or if-else
                statement = this.trueValue[this.index];
                if(statement.start == -1)
                    statement.start = index;
                break;
            case 2: //body else-endif
                statement = this.falseValue[this.index];
                if(statement.start == -1)
                    statement.start = index;
                break;
        }
    }
    onChildStateDone(state, index){
        switch(this.state){
            case 1:
                this.trueValue.push(state);
                this.trueValue.push({start: index, end: -1, string: undefined});
                this.index = this.trueValue.length - 1;
                break;
            case 2:
                this.falseValue.push(state);
                this.falseValue.push({start: index, end: -1, string: undefined});
                this.index = this.falseValue.length - 1;
                break;
        }
    }
    onChildState(state, index){
        switch(this.state){
            case 1:
                this.trueValue[this.index].end = index;
                break;
            case 2:
                this.falseValue[this.index].end = index;
                break;
        }
    }
    startElseStatement(index){
        this.trueValue[this.index].end = index; 
        this.state = 2;
        this.index = 0;
    }
    onStateDone(index){
        this.onChildState(null, index); //same functionality
    }
    execute(){
        let arr;
        if(!this.statement.string)
            this.statement.string = this.request.chunk.substring(this.statement.start, this.statement.end);
        if(this.scope.execute(this.statement.string)){
            arr = this.trueValue;
        }else{
            arr = this.falseValue;
        }
        for(let i = 0; i < arr.length; i++)
        {
            let entry = arr[i];
            if(entry instanceof ParseState)
                entry.execute();
            else{
                if(!entry.string)
                    entry.string = this.request.chunk.substring(entry.start, entry.end);
                this.request.write(entry.string);
            }
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