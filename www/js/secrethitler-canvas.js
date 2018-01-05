let disableCanvas;
let enableCanvas;
let setGameForCanvas;
let setLocalPlayer;
/**
 * @param {string} id
 * @returns {HTMLImageElement}
 */
let getImage = id => {}
(() => {
    const oneSixtieth = 1000 / 60; //the amount of ms 1 frame has
    let _spriteId = 0;
    class Sprite extends PIXI.Sprite{

        constructor(...params){
            super(...params)
            this.spriteId = _spriteId++;
        }
    }
    class AnimationManager{
        constructor(app){
            this.app = app;
            this.animatingObjects = {};
            this.speed = 0.75;
        }
        /**
         * @param {Sprite} object 
         * @param {number} toX 
         * @param {number} toY 
         * @param {number} speed 
         * @param {Function[]} queue 
         * @param {number} delay 
         */
        animate(object, toX, toY, speed = undefined, queue = [], delay = 0){
            let func = this.animatingObjects[object.spriteId];
            if(func){ //an existing animation is happening on this object, remove it
                func.queue.push({object, toX, toY, speed});
                return;
            }
            let startX = object.x;
            let startY = object.y;
            if(speed === undefined)
                speed = this.calculateSpeed(startX, startY, toX, toY);
            let progress = 0;
            let obj = {queue};
            func = delta => {
                delta = oneSixtieth * delta; //get the time in milliseconds
                if(delay > 0){
                    if(delay > delta){
                        delay -= delta;
                        return;
                    }
                    delta -= delay; //we have a couple of ms remaining for delta
                }
                progress = Math.min(progress + delta, speed);
                let percent = progress / speed;
                object.x = this.lerp(startX, toX, percent);
                object.y = this.lerp(startY, toY, percent);
                if(progress >= speed){
                    this.app.ticker.remove(func);
                    delete this.animatingObjects[object.spriteId];
                    if(obj.queue.length > 0)
                    {
                        let [item, ...newQueue] = obj.queue;
                        this.animate(item.object, item.toX, item.toY, item.speed, newQueue);
                    }
                }
            };
            obj.func = func;
            this.app.ticker.add(func);
            this.animatingObjects[object.spriteId] = obj;
        }
        lerp(from, to, percentage){
            return (to - from) * percentage + from; 
        }
        calculateSpeed(startX, startY, toX, toY){
            let x = toX - startX;
            let y = toY - startY;
            return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) * this.speed; 
        }
    }
    class BoardManager{
        constructor(){
            this.fascistBoards = [];
            this.drawCards = [];
            this.discardCards = [];
            this.playerViews = [];
            this.plagues = {};
            this.playerContainerOffset = 140;
            this.cardY = 300;
            this.playedCards = [];
            this.fascistId = 0;
            this.liberalId = 0;
        }
        initialize(app){
            this.app = app;
            this.animationManager = new AnimationManager(app);
            this.initializeBoards(app);
            this.initializeCardPiles(app);
            this.initializePlayerView(app);
        }
        setPlagueAtSeat(plague, seat){
            if(plague.currentSeat >= 0)
                this.playerViews[plague.currentSeat].plagueCount--;
            plague.currentSeat = seat;
            this.playerViews[seat].plagueCount++;
        }
        initializePlague(plague, seat){
            let loc = this.getPlagueLocationForId(seat);
            plague.x = loc.x;
            plague.y = loc.y;
            this.setPlagueAtSeat(plague, seat);
        }
        movePlagueToPlayer(plague, id){
            let target = this.playerViews[id];
            if(!target) return console.error('unknown argument to movePlagueToPlayer', plague, id);
            let loc = this.getPlagueLocationForId(id);
            this.animationManager.animate(plague, loc.x, loc.y);
            this.setPlagueAtSeat(plague, id);
        }
        getPlagueLocationForId(id){
            return {x: 70 + id * 140, y: 600 - 60 * this.playerViews[id].plagueCount};
        }
        sendCardToLocation(card, toX, toY, delay = 0){
            this.animationManager.animate(card, toX, toY, undefined, [], delay);
        }
        sendCardsToLocation(cardArr, toX, toY, delay = 0){
            for(let i = 0; i < cardArr.length; i++)
                this.sendCardToLocation(cardArr[i], toX, toY - 2 * i, i * 100, delay);
        }
        initializePolicyCard(texture, {x,y}){
            let card = this.createPolicyCard();
            card.texture = texture;
            card.x = x;
            card.y = y;
            this.app.stage.addChild(card);
            this.playedCards.push(card);
        }
        initializeGame(game){
            //set players
            if(game.turnOrder && game.turnOrder.length > 0)
                for(let playerId of game.turnOrder)
                    this.addPlayerView(game.players[playerId]);
            else
                for(let playerId in game.players)
                    this.addPlayerView(game.players[playerId]);

            //set draw cards
            for(let i = 0; i < game.drawDeck; i++)
                this.addDrawCard();
            for(let i = 0; i < game.discardDeck; i++)
                this.addDiscardCard();

            if(game.president >= 0)
                this.initializePlague(this.plagues.president, game.president);
            if(game.chancellor >= 0)
                this.initializePlague(this.plagues.chancellor, game.chancellor);
            if(game.previousPresident >= 0)
                this.initializePlague(this.plagues['previous-president'], game.previousPresident);
            if(game.previousChancellor >= 0)
                this.initializePlague(this.plagues['previous-chancellor'], game.previousChancellor);

            for(let i = 0; i < game.fascistsCardsPlayed; i++)
                this.initializePolicyCard(image['policy-fascist'], this.getLocationForFascistPolicy(i + 1));
            for(let i = 0; i < game.liberalCardsPlayed; i++)
                this.initializePolicyCard(image['policy-liberal'], this.getLocationForLiberalPolicy(i + 1));

            //enable canvas if not JoinGameState
            this.gameStateChanged(game.state);
            //state specific init

            switch(game.state){
                case 'LegislativeStatePresident':
                    let loc = this.getPlagueLocationForId(game.president);
                    let cards = [];
                    for(let i = 0; i < 3; i++){
                        let card = this.createPolicyCard();
                        card.x = loc.x;
                        card.y = loc.y - i * 2;
                        this.app.stage.addChild(card);
                        cards.push(card);
                    }
                    this.cardsAtPresident = cards;
                    break;
                case 'LegislativeStateChancellor':
                    let discardLoc = this.getPlagueLocationForId(game.chancellor);
                    let discardCards = [];
                    for(let i = 0; i < 2; i++){
                        let card = this.createPolicyCard();
                        card.x = discardLoc.x;
                        card.y = discardLoc.y - i * 2;
                        this.app.stage.addChild(card);
                        discardCards.push(card);
                    }
                    this.cardAtChancellor = discardCards;
                    break;

            }
        }
        gameStateChanged(state, oldState){
            if(oldState)
                container.classList.remove(oldState);
            container.classList.add(state);
            if(this.localPlayer){
                switch(state){
                    case 'VoteForGovernment':
                        new VoteDialog(result => this.sendPlayerVote(result), this.playerViews[game.president].player, this.playerViews[game.chancellor].player).create();
                        break;
                    case 'PresidentPickChancellorState':
                        if(this.playerViews[game.president].player.id == this.localPlayer.id)
                            new PickChancellorDialog(seat => this.mimicMessage('pick-chancellor', seat)).create();
                        break;
                }
            }
        }
        sendPlayerVote(vote){
            this.mimicMessage('vote', vote && 'yes' || 'no');
        }
        /**
         * @param {...string} params 
         */
        mimicMessage(...params){
            sendMessage('sh_mimic_telegram', {gameId: game.chatId, playerId: this.localPlayer.id, params});
        }
        initializePlayerView(app){
            let playerContainer = new PIXI.Container();
            playerContainer.y = app.screen.height;
            app.stage.addChild(playerContainer);
            this.playerContainer = playerContainer;
        }
        addPlayerView(player, index = this.playerViews.length){
            let playerContainer = this.playerContainer;
            let container = new PIXI.Container();
            container.x = index * this.playerContainerOffset;

            let name = playerName(player);
            let nameLabel = new PIXI.Text(name, {fontSize: 16, wordWrap: true, wordWrapWidth: 140});
            nameLabel.anchor.set(0, 1);
            container.addChild(nameLabel);

            let picture = image['secret-role-back'];
            let picSprite = new Sprite(picture);
            picSprite.scale.set(0.2372);
            picSprite.anchor.set(0, 1);
            picSprite.y = -32;
            container.addChild(picSprite);
            playerContainer.addChild(container);

            let yesCard = new Sprite(image['ballot-yes']);
            let noCard = new Sprite(image['ballot-no']);
            let voteCard = new Sprite(image['ballot-back']);
            for(let card of [yesCard, noCard, voteCard]){
                card.scale.set(0.16);
                card.anchor.set(0, 1);
                card.y = -200;
                container.addChild(card);
                card.visible = false;
            }
            this.playerViews.push({
                container,
                picture: picSprite,
                player,
                plagueCount: 0,
                yesCard,
                noCard,
                voteCard
            });
            this.verifyFascistBoard();
        }
        verifyFascistBoard(){
            let count = this.playerViews.length;
            this.fascistBoards[0].visible = count <= 6;
            this.fascistBoards[1].visible = count > 6 && count < 9;
            this.fascistBoards[2].visible = count >= 9;
        }
        removePlayerView(player){
            let found = false;
            let views = this.playerViews;
            for(let i = 0; i < views.length;i++){
                let view = views[i];
                if(view.player.id == player.id){
                    console.log(view);
                    views.splice(i, 1);
                    found = true;
                    view.container.destroy({children: true});
                    i--; //make sure next iteration is on this index again
                }else if(found)
                    view.container.x = i * this.playerContainerOffset;
            }
        }
        initializeCardPiles(app){
            const cardY = this.cardY;
            let drawPile = image['draw-pile'];
            let drawSprite = new Sprite(drawPile);
            drawSprite.anchor.set(0, 0.5);
            drawSprite.y = cardY;
            drawSprite.scale.set(0.2);
            app.stage.addChild(drawSprite);

            let discardPile = image['discard-pile'];
            let discardSprite = new Sprite(discardPile);
            discardSprite.anchor.set(0, 0.5);
            discardSprite.y = cardY;
            discardSprite.scale.set(0.2);
            discardSprite.x = 875;
            app.stage.addChild(discardSprite);
        }
        createPolicyCard(){
            let cardBack = image['policy-back'];
            let card = new Sprite(cardBack);
            card.anchor.set(0, 0.5);
            card.scale.set(0.2);
            return card;
        }
        getDrawCardLocation(){
            return {
                x: 20,
                y: this.cardY - 5 - this.drawCards.length * 2
            };
        }
        getDiscardCardLocation(){
            return {
                x: 895,
                y: this.cardY - 5 - this.discardCards.length * 2
            };
        }
        addDrawCard(){
            let card = this.createPolicyCard();
            let {x,y} = this.getDrawCardLocation();
            card.x = x;
            card.y = y;
            this.app.stage.addChild(card);
            this.drawCards.push(card);
        }
        addDiscardCard(){
            let card = this.createPolicyCard();
            let {x, y} = this.getDiscardCardLocation();
            card.x = x;
            card.y = y;
            this.app.stage.addChild(card);
            this.discardCards.push(card);
        }
        initializeBoards(app){
            let libBoard = image['liberal-board'];
            let sprite = new Sprite(libBoard);

            sprite.anchor.set(0, 0.5);
            sprite.y = 125;
            sprite.x = 150;
            sprite.scale.set(0.2);
            app.stage.addChild(sprite);

            for(let playerCount of ['56', '78', '9+'])
            {
                let board = new Sprite(image[`fascist-board${playerCount}`]);
                board.anchor.set(0, 0.5);
                board.scale.set(0.2);
                board.y = 400;
                board.x = 150;
                board.visible = '9+' == playerCount;
                app.stage.addChild(board);
                this.fascistBoards.push(board);
            }

            let plagues = ['president', 'chancellor', 'previous-president', 'previous-chancellor'];
            for(let i = 0; i < plagues.length; i++){
                let plague = image[plagues[i]];
                let sprite = new Sprite(plague);
                sprite.anchor.set(0.5, 0);
                sprite.scale.set(0.06);
                sprite.x = 1100;
                sprite.y = 60 * i + 200;
                app.stage.addChild(sprite);
                this.plagues[plagues[i]] = sprite;
            }
        }
        setPlagueInitialPosition(){
            let plagues = ['president', 'chancellor', 'previous-president', 'previous-chancellor'];
            for(let i = 0; i < plagues.length; i++){
                let sprite = this.plagues[plagues[i]];
                sprite.x = 1100;
                sprite.y = 60 * i + 200;
            }
        }
        findPlayerViewById(id){
            let views = this.playerViews;
            for(let i = 0; i < views.length;i++){
                let view = views[i];
                if(view.player.id == id)
                    return view;
            }
        }
        seatPlayersInTurnOrder(obj){
            let newSeats = [];
            for(let playerId of obj.turnOrder)
                newSeats.push(this.findPlayerViewById(playerId));
            this.playerViews = newSeats;
            for(let i = 0; i < newSeats.length; i++)
                newSeats[i].container.x = i * this.playerContainerOffset;
        }
        resetDrawPiles(){
            while(this.drawCards.length != 17)
                this.addDrawCard();
            while(this.discardCards.length != 0)
                this.discardCards.splice(0, 1)[0].destroy();
            for(let card of this.playedCards)
                card.destroy();
        }
        onGameStart(game){
            this.seatPlayersInTurnOrder(game);
            this.setPlagueInitialPosition();
            this.resetDrawPiles();
        }
        getLocationForLiberalPolicy(id){
            return {
                x: 268 + (id - 1) * 96,
                y: 123
            };
        }
        getLocationForFascistPolicy(id){
            return {
                x: 222 + (id - 1) * 96,
                y: 403
            };
        }
        handleEvent(eventName, obj){
            switch(eventName){
                case 'sh_player_joined': //obj == player
                    this.addPlayerView(obj);
                    break;
                case 'sh_player_left': //obj == player
                    this.removePlayerView(obj);
                    break;
                case 'sh_start_game': //obj == game
                    this.onGameStart(obj);
                    break;
                case 'sh_init_state': //obj == game
                    this.initializeGame(obj);
                    break;
                case 'sh_state_changed': //obj == {old: oldState, new: newState}
                    this.gameStateChanged(obj.new, obj.old);
                    break;
                case 'sh_new_president': //obj == seatId of new president
                    this.movePlagueToPlayer(this.plagues.president, obj);
                    break;
                case 'sh_new_chancellor': //obj == seatId of new chancellor
                    this.movePlagueToPlayer(this.plagues.chancellor, obj);
                    break;
                case 'sh_new_previous_president': //obj == seatId of prev President
                    this.movePlagueToPlayer(this.plagues['previous-president'], obj);
                    break;
                case 'sh_new_previous_chancellor': //obj == seatId of prev chancellor
                    this.movePlagueToPlayer(this.plagues['previous-chancellor'], obj);
                    break;
                case 'sh_draw_deck_reshuffled':
                    for(let i = 0; i < this.discardCards.length; i++){
                        let card = this.discardCards[this.discardCards.length - 1 - i];
                        let loc = this.getDrawCardLocation();
                        this.sendCardToLocation(card, loc.x, loc.y, i * 50);
                        this.drawCards.push(card);
                    }
                    break;
                case 'sh_president_draw_policy':
                    let cards = this.drawCards.splice(this.drawCards.length - 3, 3);
                    let loc = this.getPlagueLocationForId(game.president);
                    this.sendCardsToLocation(cards, loc.x, loc.y);
                    this.cardsAtPresident = cards;
                    break;
                case 'sh_president_discard_card':
                    let [discardCard, ...toChancellor] = this.cardsAtPresident;
                    delete this.cardsAtPresident;
                    let discardLoc = this.getDiscardCardLocation();
                    this.sendCardToLocation(discardCard, discardLoc.x, discardLoc.y);
                    let playerLoc = this.getPlagueLocationForId(game.chancellor);
                    this.sendCardsToLocation(toChancellor, playerLoc.x, playerLoc.y);
                    this.cardAtChancellor = toChancellor;
                    this.discardCards.push(discardCard);
                    break;
                case 'sh_chancellor_plays_card':
                    let [playCard, discardCard2] = this.cardAtChancellor;
                    let discardLoc2 = this.getDiscardCardLocation();
                    this.discardCards.push(discardCard2);
                    this.sendCardToLocation(discardCard2, discardLoc2.x, discardLoc2.y);
                    this.sendCardToBoard(playCard, obj);
                    break;
                case 'sh_player_voted':
                    this.showPlayerVoted(obj);
                    break;
                case 'sh_vote_result': //{yesCount, noCount, votes: {playerId: boolean}}
                    this.showPlayerVoteResult(obj);
                    break;
                case 'sh_private_message':
                    this.handlePrivateMessage(obj);
                    break;
            }
        }
        handlePrivateMessage({identifier, data, message, keyboard}){
            switch(identifier){
                case 'announce_role':
                    for(let role of data)
                        this.revealRole(role.id, role.role);
                    break;
                case 'pick_card_chancellor':
                    new ChancellorPickCardDialog(selectedCard => {
                        this.mimicMessage('pick-card', selectedCard);
                        this.mimicMessage('confirm-card');
                    }, data).create();
                    break;
                case 'pick_card_president':
                    new PresidentPickCardDialog(selectedCards => {
                        this.mimicMessage('pick-card', selectedCards[0]);
                        this.mimicMessage('pick-card', selectedCards[1]);
                        this.mimicMessage('confirm-pick-card');
                    }, data).create();
                    break;
            }
            Materialize.toast(message.replace(/\n/g, '<br>'), 5000);
        }
        revealRole(playerId, role){
            let view = this.findPlayerViewById(playerId);
            let texture;
            switch(role){
                case 'Fascist':
                    texture = `secret-role-fascist-${++this.fascistId}`;
                    break;
                case 'Liberal':
                    texture = `secret-role-liberal-${++this.liberalId}`;
                    break;
                case 'Hitler':
                    texture = 'secret-role-hitler';
                    break;
            }
            view.picture.texture = image[texture];
        }
        showPlayerVoted(playerId){
            let view = this.findPlayerViewById(playerId);
            view.voteCard.visible = true;
        }
        showPlayerVoteResult(result){//{yesCount, noCount, votes: {playerId: boolean}}
            let shownCards = [];
            for(let view of this.playerViews){
                view.voteCard.visible = false;
                let card = result.votes[view.player.id] && view.yesCard || view.noCard;
                card.visible = true;
                shownCards.push(card);
            }
            setTimeout(() => {
                for(let card of shownCards)
                    card.visible = false;
            }, 5000);
        }
        sendCardToBoard(cardObj, card){
            let loc;
            let texture;
            if(card.faction == 'Liberal'){
                loc = this.getLocationForLiberalPolicy(game.liberalCardsPlayed);
                texture = image['policy-liberal'];
            }else{ //fascist
                loc = this.getLocationForFascistPolicy(game.fascistsCardsPlayed);
                texture = image['policy-fascist'];
            }
            cardObj.texture = texture;
            this.animationManager.animate(cardObj, loc.x, loc.y);
            this.playedCards.push(cardObj);
        }
        setLocalPlayer(player){
            console.log('Local player', player);
            this.localPlayer = player;
        }
    }
    let container = document.querySelector('#canvascontainer');
    let main = document.querySelector('main');
    /**
     * @type {Object.<string, HTMLImageElement>}
     */
    let image = {};
    let header = document.querySelector('header');
    let boardManager = new BoardManager();
    let app;
    let imageUrls = [
        'ballot-back',
        'ballot-no',
        'ballot-yes',
        'chancellor',
        'discard-pile',
        'draw-pile',
        'fascist-board9+',
        'fascist-board56',
        'fascist-board78',
        'liberal-board',
        'not-hitler',
        /*'party-membership-back',
        'party-membership-fascist',
        'party-membership-liberal',*/
        'policy-back',
        'policy-fascist',
        'policy-liberal',
        'president',
        'previous-president',
        'previous-chancellor',
        'secret-role-back',
        'secret-role-fascist-1',
        'secret-role-fascist-2',
        'secret-role-fascist-3',
        'secret-role-hitler',
        'secret-role-liberal-1',
        'secret-role-liberal-2',
        'secret-role-liberal-3',
        'secret-role-liberal-4',
        'secret-role-liberal-5',
        'secret-role-liberal-6',
    ];

    function loadImages(){
        for(let url of imageUrls){
            if(image[url]) continue;
            image[url] = PIXI.Texture.fromImage(`img/${url}.png`);
        }
    }
    let enabled = false;
    disableCanvas = () => {
        if(!enabled) return;
        container.classList.add('disabled');
        main.classList.add('container');
        main.classList.remove('running');
        header.style.display = '';
        container.removeChild(app.view);
        enabled = false;
    };
    
    enableCanvas = () => {
        if(enabled) return;
        container.classList.remove('disabled');
        header.style.display = 'none';
        main.classList.remove('container');
        main.classList.add('running');
        enabled = true;
    };

    loadImages();
    app = new PIXI.Application(1400, 900, {transparent: true});
    container.appendChild(app.view);
    container.insertBefore(app.view, container.firstChild);
    boardManager = new BoardManager();
    boardManager.initialize(app);
    enableCanvas();
    onWebSocket(() => addHandler('*', (ev, obj) => {
        if(boardManager)
            boardManager.handleEvent(ev, obj);
    }));
    setLocalPlayer = player => boardManager.setLocalPlayer(player);
    getImage = id => image[id];
})();