class Stack{
    constructor(){
        this.root = {prev: null, isRoot: true};
        this.length = 0;
    }
    push(item){
        let newNode = {
            prev: this.root,
            val: item
        };
        this.root = newNode;
    }
    pop(){
        if(this.root.isRoot) return;
        let node = this.root;
        this.root = node.prev;
        return node.val;
    }
    peek(){
        return this.root.val;
    }
}
module.exports = Stack;