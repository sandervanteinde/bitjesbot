(() => {
    /**
     * @param {HTMLElement} container 
     */
    function initializeContainer(container){
        let activeTab = null;
        
        /**
         * @param {HTMLElement} content 
         */
        function animateAppearContent(content){
            let target = content.clientHeight;
            let progress = 0;
            const animationTime = 750;
            let interval = setInterval(() => {
                progress += 16;
                let perc = Math.min(progress / animationTime, 1);
                let height = Math.floor(target * perc);
                content.style.height = `${height}px`;
                if(content.clientHeight >= target){
                    clearInterval(interval);
                    content.style.removeProperty('height');
                }

            }, 16);
            content.style.height = '0px';
        }
        /**
         * @param {HTMLElement} tab 
         */
        function hideTab(tab){
            /**
             * @type {HTMLElement}
             */
            let container = tab.container;
            tab.classList.remove('active');
            container.classList.add('inactive');
            activeTab = null;
        }
        /**
         * @param {MouseEvent} ev 
         */
        function onClickTab(ev){
            /**
             * @type {HTMLDivElement}
             */
            let tab = ev.target;
            /**
             * @type {HTMLElement}
             */
            let container = tab.container;
            if(tab == activeTab)
                return hideTab(tab);
            tab.classList.add('active');
            container.classList.remove('inactive');
            let animate = activeTab == null;
            if(activeTab)
                hideTab(activeTab);
            activeTab = tab;
            if(animate)
                animateAppearContent(container);
        }
        /**
         * @param {HTMLDivElement} tab 
         * @param {HTMLElement} target 
         */
        function initializeTab(tab, target){
            tab.onclick = onClickTab;
            tab.container = target;
            target.classList.add('inactive');
        }

        for(let tab of container.querySelectorAll('.tabcontainer .tab')){
            let target = tab.attributes.getNamedItem('target');
            target = container.querySelector(`#${target.value}`);
            initializeTab(tab, target);
        }
    }

    for(let container of document.querySelectorAll('.tabcontainer')){
        initializeContainer(container);
    }
})();