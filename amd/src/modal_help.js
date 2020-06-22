define(
[
    'jquery',
    'core/modal',
    'core/modal_registry',
    'core/modal_events',
    'core/key_codes',
    'core/custom_interaction_events',
    'core/notification',
    'core/templates',
    'theme_urcourses_default/modal_help_ajax'
],
function(
    $,
    Modal,
    ModalRegistry,
    ModalEvents,
    KeyCodes,
    CustomEvents,
    Notification,
    Templates,
    ModalHelpAjax
) {
    var registered = false;

    var SELECTORS = {
        SEARCH: '#modal_help_search',
        SEARCH_BUTTON: '#modal_help_search_btn',
        SUGGESTIONS: '#modal_help_search_suggestions',
        SUGGESTION_ITEM: '.modal-help-suggestion-item',
        SUGGESTION_ITEM_SEL: '.modal-help-suggestion-item.selected'
    };

    var TEMPLATES = {
        LOADING: 'core/loading',
        MODAL_HELP_CONTENT: 'theme_urcourses_default/modal_help_content',
        MODAL_HELP_TOPICS: 'theme_urcourses_default/modal_help_topics'
    };

    /*
     * Modal constructor.
     *
     * @param {object} root The root jQuery element for the modal.
     */
    var ModalHelp = function(root) {
        Modal.call(this, root);
        this.searchBox = this.root.find(SELECTORS.SEARCH);
        this.searchButton = this.root.find(SELECTORS.SEARCH_BUTTON);
        this.suggestionBox = this.root.find(SELECTORS.SUGGESTIONS);
        this.topicList = null;
        this.suggestionIndex = 0;
    };

    ModalHelp.prototype = Object.create(Modal.prototype);
    ModalHelp.prototype.constructor = ModalHelp;
    ModalHelp.TYPE = 'theme_urcourses_default-help';

    ModalHelp.prototype.getHelp = function() {
        console.log('help');
        console.log(this.getSelectedSuggestion());
    };

    ModalHelp.prototype.selectSuggestion = function(suggestion) {
        this.suggestionBox.find(SELECTORS.SUGGESTION_ITEM).removeClass('selected');
        suggestion.addClass('selected');
    };

    ModalHelp.prototype.getSuggestions = function() {
        return this.suggestionBox.find(SELECTORS.SUGGESTION_ITEM);
    };

    /**
     * Set up event handling.
     *
     * @method registerEventListeners
     */
    ModalHelp.prototype.registerEventListeners = function() {
        Modal.prototype.registerEventListeners.call(this);

        this.getRoot().on(ModalEvents.shown, () => {
            ModalHelpAjax.getRemtlHelp()
            .then((response) => {
                var renderPromise = Templates.render(TEMPLATES.MODAL_HELP_CONTENT, {html: response.html});
                return this.setBody(renderPromise);
            }).catch(Notification.exception);
            ModalHelpAjax.getTopicList()
            .then((response) => {
                this.topicList = response;
                this.topicList.sort((a, b) => a.title.localeCompare(b.title));
                return Templates.render(TEMPLATES.MODAL_HELP_TOPICS, {topics: response});
            })
            .then((html, js) => {
                return Templates.replaceNodeContents(SELECTORS.SUGGESTIONS, html, js);
            }).catch(Notification.exception);
        });

        this.getRoot().on(ModalEvents.hidden, () => {
            this.setBody('');
            this.searchBox.val('');
            this.suggestionBox.addClass('d-none');
            Templates.render(TEMPLATES.LOADING, {})
            .then((html, js) => {
                return Templates.replaceNodeContents(SELECTORS.SUGGESTIONS, html, js);
            }).catch(Notification.exception);
        });

        this.getRoot().on('click', (e) => {
            var target = e.target;
            var searchBox = this.searchBox[0];
            var suggestionBox = this.suggestionBox[0];
            if (!(target === searchBox) && !(target === suggestionBox)) {
                this.suggestionBox.addClass('d-none');
            }
        });

        this.getModal().on('focus', SELECTORS.SEARCH, () => {
            this.suggestionBox.removeClass('d-none');
            this.selectSuggestion(this.getSuggestions().eq(0));
        });

        this.getModal().on('input', SELECTORS.SEARCH, () => {
            var searchValue = this.searchBox.val();
            var regex = RegExp(searchValue.split('').join('.*'), 'i');
            var suggestions = [];
            for (var topic of this.topicList) {
                var match = regex.exec(topic.title);
                if (match) {
                    suggestions.push({
                        title: topic.title,
                        url: topic.url,
                        length: match[0].length,
                        start: match.index
                    });
                }
            }
            suggestions.sort((a, b) => {
                if (a.start < b.start) {
                    return -1;
                }
                if (a.start > b.start) {
                    return 1;
                }
                if (a.length < b.length) {
                    return -1;
                }
                if (a.length > b.length) {
                    return 1;
                }
            });
            Templates.render(TEMPLATES.MODAL_HELP_TOPICS, {topics: suggestions})
            .then((html, js) => {
                Templates.replaceNodeContents(SELECTORS.SUGGESTIONS, html, js);
                this.selectSuggestion(this.getSuggestions().eq(0));
            }).catch(Notification.exception);
        });

        this.getModal().on('keydown', SELECTORS.SEARCH, (e) => {
            var suggestions = this.getSuggestions();
            if (e.keyCode === KeyCodes.arrowDown || e.keyCode === KeyCodes.arrowRight) {
                e.preventDefault();
                this.suggestionIndex = 1;
                suggestions.eq(this.suggestionIndex).focus();
            } else if (e.keyCode === KeyCodes.arrowUp || e.keyCode === KeyCodes.arrowLeft) {
                e.preventDefault();
                this.suggestionIndex = suggestions().length - 1;
                suggestions.eq(this.suggestionIndex).focus();
            } else if (e.keyCode === KeyCodes.enter) {
                this.searchBox.val(this.getSuggestions().eq(0).attr('data-value'));
                this.suggestionBox.addClass('d-none');
            }
        });

        this.getModal().on('keydown', SELECTORS.SUGGESTION_ITEM, (e) => {
            var suggestions = this.getSuggestions();
            if (e.keyCode === KeyCodes.arrowDown || e.keyCode === KeyCodes.arrowRight) {
                e.preventDefault();
                this.suggestionIndex++;
                if (this.suggestionIndex > suggestions.length - 1) {
                    this.suggestionIndex = 0;
                }
                suggestions.eq(this.suggestionIndex).focus();
            } else if (e.keyCode === KeyCodes.arrowUp || e.keyCode === KeyCodes.arrowLeft) {
                e.preventDefault();
                this.suggestionIndex--;
                if (this.suggestionIndex < 0) {
                    this.suggestionIndex = suggestions.length - 1;
                }
                suggestions.eq(this.suggestionIndex).focus();
            }
        });

        this.getModal().on(CustomEvents.events.activate, SELECTORS.SUGGESTION_ITEM, (e) => {
            this.searchBox.val($(e.target).attr('data-value'));
        });

        this.getModal().on('mouseover focus', SELECTORS.SUGGESTION_ITEM, (e) => {
            this.selectSuggestion($(e.target));
        });
    };

    if (!registered) {
        ModalRegistry.register(ModalHelp.TYPE, ModalHelp, 'theme_urcourses_default/modal_help');
        registered = true;
    }

    return ModalHelp;
});
