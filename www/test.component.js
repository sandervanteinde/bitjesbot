const Component = require('../utils/web/component');

class TestComponent extends Component{
    constructor(){
        super();
        this.title = 'Hello World';
    }
    getTemplate(){
        return 'test.html';
    }
}
module.exports = TestComponent;