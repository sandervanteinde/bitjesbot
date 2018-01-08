const Component = require('../utils/web/component');
const Request = require('../utils/request');
const GameRegistry = require('../init/secrethitler/gameregistry');
class SecretHitlerComponent extends Component{
    constructor(request){
        super(request);
        this.requiredParameters.push('gameid');
        
        this.scripts.push(
            'js/pixi.js',
            'js/secrethitler-canvas.js',
            'js/secrethitler-playertable.js', 
            'js/secrethitler-chat.js',
            'js/secrethitler.js',
            'js/tabs.js'
        );
        this.styles.push(
            'css/secrethitler.css',
            'css/tabs.css'
        );
    }
    getTemplate(){
        return 'secrethitler.html';
    }
    /**
     * @param {Request} request 
     */
    preParseRequest(request){
        let gameId = request.params.gameid;
        let game = GameRegistry.getGame(gameId);
        if(!game)
            return request.notFound();
        return true;
    }
}
module.exports = SecretHitlerComponent;