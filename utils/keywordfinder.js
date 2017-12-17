class Keyword{
    /**
     * 
     * @param {string} letter 
     * @param {number} depth 
     * @param {Keyword} parent 
     * @param {string} result 
     */
    constructor(letter, depth, parent, result = undefined){
        this.letter = letter;
        this.result = result;
        /**
         * @type {Object<string,Keyword>}
         */
        this.letters = {};
        this.depth = depth;
        this.parent = parent;
        /**
         * @type {function(string):void}
         */
        this.onFalsePositive = undefined;
    }
    /**
     * @param {string} letter 
     * @param {string} result 
     * @returns {Keyword}
     */
    addLetter(letter, result){
        this.letters[letter] = this.letters[letter] || new Keyword(letter, this.depth + 1, this, result);
        return this.letters[letter];
    }
}

class KeywordFinder extends Keyword{
    /**
     * @param {string[]} keywords 
     */
    constructor(...keywords){
        super(null, 0, null, null);
        /**
         * @type {Keyword}
         */
        this.state = this;
        for(let keyword of keywords)
            this.registerKeyword(keyword);
    }
    /**
     * @returns {boolean}
     */
    get isFindingKeyword(){ return this.state.depth > 0;}
    /**
     * @param {string} word 
     */
    registerKeyword(word){
        /**
         * @type {Keyword}
         */
        let obj = this;
        let length = word.length;
        for(let i = 0; i < length; i++){
            obj = obj.addLetter(word[i], (i + 1 == length) && word || false);
        }
    }
    /**
     * @param {string} letter
     * @param {boolean} checkDepth 
     */
    onInput(letter, checkDepth = true){
        let state = this.state;
        let newState = state.letters[letter];
        if(newState){
            if(newState.result){
                this.reset();
                return newState.result;
            }
            this.state = newState;
        }else if(state.depth > 1 && checkDepth){
            let prevLetters = [letter];
            while(state.depth != 1){
                prevLetters.push(state.letter);
                state = state.parent;
            }
            prevLetters = prevLetters.reverse();
            let original = [state.letter, ...prevLetters];
            this.reset();
            while(prevLetters.length >= 1){
                for(let letter of prevLetters){
                    this.onInput(letter, false);
                    if(this.state == this)
                        break;
                }
                if(this.state != this)
                    break;
                [,...prevLetters] = prevLetters;
            }
            if(this.state == this && this.onFalsePositive)
                this.onFalsePositive(original.join('').substr(0, original.length - 1));
            
        }else{
            this.reset();
        }
    }
    reset(){
        this.state = this;
    }
}
module.exports = KeywordFinder;