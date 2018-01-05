class Dialog{
    constructor(options = {dismissible: false}){
        this.options = options;
        this.title = '';
        /**
         * @type {HTMLElement[]}
         */
        this.content = [];
        /**
         * @type {HTMLElement[]}
         */
        this.footer = [];
        /**
         * @type {function()}
         */
        this.callback = undefined;
        
    }
    create(){
        let modal = document.createElement('div');
        modal.classList.add('modal', this.constructor.name);
        
        let modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        let title = document.createElement('h4');
        title.innerHTML = this.title;
        modalContent.appendChild(title);
        for(let el of this.content)
            modalContent.appendChild(el);
        modal.appendChild(modalContent);

        if(this.footer.length > 0){
            let footer = document.createElement('div');
            footer.classList.add('modal-footer');
            for(let el of this.footer)
                footer.appendChild(el);
            modal.appendChild(footer);
        }
        

        document.body.appendChild(modal);
        this.options.complete = this.callback;
        $(modal).modal(this.options);
        this.modal = modal;
        this.modalContent = modalContent;
        this.open();
    }
    open(){
        $(this.modal).modal('open');

    }
    close(destroy = true){
        if(!this.modal) return;
        $(this.modal).modal('close');
        if(destroy){
            this.modal.remove();
            delete this.modal;
        }
    }
    paragraph(text){
        let p = document.createElement('p');
        p.innerHTML = text;
        return p;
    }
    button(text, callback = undefined){
        let button = document.createElement('button');
        button.classList.add('btn');
        button.innerHTML = text;
        button.onclick = callback;
        return button;
    }
    input(type = 'text', placeholder = undefined){
        let input = document.createElement('input');
        input.setAttribute('type', type);
        if(placeholder)
            input.setAttribute('placeholder', placeholder);
        return input;
    }
    div(){
        return document.createElement('div');
    }

}

class UsernameDialog extends Dialog{
    constructor(callback){
        super();
        this.title = 'Enter a username';

        let input = this.input('text', 'Enter your username here...');
        this.content.push(input);
        this.inputField = input;

        let submitBtn = this.button('Set username', () => this.close());
        submitBtn.classList.add('green');
        this.content.push(submitBtn);

        if(callback)
            this.callback = () => callback(input.value);
    }
    create(...params){
        super.create(...params);
        this.inputField.focus();
    }
}
class VoteDialog extends Dialog{
    constructor(callback, president, chancellor){
        super();
        this.title = 'Vote for the government';
        this.content.push(
            this.paragraph(`The president is: ${playerName(president)}`),
            this.paragraph(`The chancellor is: ${playerName(chancellor)}`)
        );
        let yes = this.button('Ja!', () => this.vote(true));
        yes.classList.add('green');

        let no = this.button('Nein!', () => this.vote(false));
        no.classList.add('red');

        this.content.push(yes, no);

        this.result = callback;
    }
    /**
     * @param {boolean} result 
     */
    vote(result){
        this.result(result);
        this.close();
    }
}
class ChancellorPickCardDialog extends Dialog{
    /**
     * @param {function(number):void} callback 
     * @param {*} cards 
     */
    constructor(callback, cards){
        super();
        this.title = 'Pick the card you would like to play';
        this.cards = cards;
        this.picked = -1;
        /**
         * @type {HTMLButtonElement[]}
         */
        this.buttons = [];
        for(let i = 0; i < this.cards.length; i++){
            let card = this.cards[i];
            let button = this.button(card.faction, ev => this.pickCard(i));
            this.buttons.push(button);
            this.content.push(button);
        }
        this.confirm = this.button('Confirm', () => {
            callback(this.picked);
            this.close();
        });
        this.confirm.setAttribute('disabled', '');
        this.content.push(this.confirm);
    }
    pickCard(index){
        if(this.picked >= 0)
            this.buttons[this.picked].classList.remove('selected');
        this.picked = index;
        this.buttons[index].classList.add('selected');
        this.confirm.removeAttribute('disabled');
    }
}
class PresidentPickCardDialog extends Dialog{
    /**
     * 
     * @param {function(number[]):void} callback 
     * @param {*} cards 
     */
    constructor(callback, cards){
        super();
        this.title = 'Pick the cards you want to pass to the chancellor';
        this.cards = cards;
        this.buttons = [];
        this.selectCount = 0;
        console.log(cards);
        for(let i = 0; i < cards.length; i++){
            let card = cards[i].card;
            card.selected = false;
            let button = this.button(card.faction, () => this.selectCard(i));
            this.buttons.push(button);
            this.content.push(button);
        }
        this.confirm = this.button('Confirm', () => {
            let selectedIndices = [];
            for(let i = 0; i < this.buttons.length; i++)
                if(this.cards[i].card.selected)
                    selectedIndices.push(i);
            if(selectedIndices.length != 2)
                throw 'Invalid amount of selectedIndices in PresidentPickCardDialog'
            callback(selectedIndices);
            this.close();
        });
        this.confirm.setAttribute('disabled', true);
        this.content.push(this.confirm);
    }
    selectCard(index){
        let card = this.cards[index].card;
        card.selected = !card.selected;
        if(card.selected)
            this.selectCount++;
        else
            this.selectCount--;
        if(this.selectCount == 2)
            this.confirm.removeAttribute('disabled');
        else
            this.confirm.setAttribute('disabled', true);
    }
}
class PickChancellorDialog extends Dialog{
    constructor(callback){
        super();
        this.title = 'Pick your chancellor';
        for(let seat = 0; seat < game.turnOrder.length; seat++)
            if(this.isEligibleForChancellor(seat)){
                let player = game.players[game.turnOrder[seat]];
                this.content.push(this.button(playerName(player), () =>{ 
                    callback(seat);
                    this.close();
                }));
            }
    }
    isEligibleForChancellor(seat){
        return seat != game.president && 
        (seat != game.previousPresident || game.alivePlayers <= 5) &&
        seat != game.previousChancellor &&
        game.players[game.turnOrder[seat]].alive;
    }
}