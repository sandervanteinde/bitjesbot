class ScopedExecution{
    /**
     * @param {any} scope 
     */
    constructor(scope){
        this.scope = scope;
        this.isScopeSet = false;
        this.replaceVars = {};
    }

    setScope(){
        if(this.isScopeSet) return;
        let scope = this.scope;
        for(let prop in scope){
            if(global[prop]){
                global[`_${prop}`] = scope[prop];
                this.replaceVars[prop] = [new RegExp(prop, 'g'), `_${prop}`];
            }else
            global[prop] = scope[prop];
        }
        this.isScopeSet = true;
    }
    addToScope(varName, value){
        this.scope[varName] = value;
        if(global[varName]){
            global[`_${varName}`] = value;
            this.replaceVars[varName] = [new RegExp(varName, 'g'), `_${varName}`];
        }else
            global[varName] = value;
    }
    removeFromScope(varName){
        let globalProp = `_${varName}`;
        if(global[globalProp])
            delete global[globalProp];
        else
            delete global[varName];
        delete this.scope[varName];
    }
    unsetScope(){
        if(!this.isScopeSet) return;
        let scope = this.scope;
        for(let prop in scope){
            let globalProp = `_${prop}`;
            if(global[globalProp])
                delete global[globalProp];
            else
                delete global[prop];
        }
        this.isScopeSet = false;
    }
    /**
     * @param {string} code 
     */
    formatCode(code){
        for(let prop in this.replaceVars){
            let [regex, replacement] = this.replaceVars[prop];
            code = code.replace(regex, replacement);
        }
        return code;
    }
    /**
     * @param {any} scope 
     * @param {string} code 
     */
    execute(code){
        let unsetScope = false;
        if(!this.isScopeSet){
            this.setScope();
            unsetScope = true;
        }
        code = this.formatCode(code);
        let val = eval(code);
        if(unsetScope)
            this.unsetScope();
        return val;
    }
}
module.exports = ScopedExecution;