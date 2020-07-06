// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Theme Boost Campus - ModalHelp class
 *
 * @package    theme_urcourses_default
 * @author     John Lane
 *
 */

import $ from 'jquery';
import Notification from 'core/notification';
import Templates from 'core/templates';
import CustomEvents from 'core/custom_interaction_events';
import KeyCodes from 'core/key_codes';
import Modal from 'core/modal';
import ModalEvents from 'core/modal_events';
import ModalRegistry from 'core/modal_registry';
import ModalHelpAjax from 'theme_urcourses_default/modal_help_ajax';
import {FuzzySet} from 'theme_urcourses_default/fuzzyset';

const SELECTORS = {
    SEARCH: '#modal_help_search',
    SEARCH_BUTTON: '#modal_help_search_btn',
    SEARCH_CLEAR: '#modal_help_search_clear',
    SUGGESTIONS: '#modal_help_search_suggestions',
    SUGGESTION_ITEM: '.modal-help-suggestion-item',
};

const TEMPLATES = {
    MODAL_HELP_CONTENT: 'theme_urcourses_default/modal_help_content'
};

export default class ModalHelp extends Modal {

    constructor(root) {
        super(root);
        this.courseId = null;
        this.currentUrl = null;
        this.topicList = null;
        this.topicIndex = FuzzySet();
        this.minSearchScore = 0;
        this.searchBox = this.modal.find(SELECTORS.SEARCH);
        this.searchButton = this.modal.find(SELECTORS.SEARCH_BUTTON);
        this.searchClear = this.modal.find(SELECTORS.SEARCH_CLEAR);
        this.suggestionBox = this.modal.find(SELECTORS.SUGGESTIONS);
    }

    init(courseId, currentUrl) {
        this.courseId = courseId;
        this.currentUrl = currentUrl;

        this.getRoot().on(ModalEvents.shown, () => {
            this.initContent();
        });

        this.getRoot().on(ModalEvents.hidden, () => {
            this.resetModal();
        });

        this.searchBox.on('input', () => {
            this.updateSearchBox();
        });

        this.searchBox.on('focus', () => {
            this.updateSearchBox();
        });

        this.searchClear.on('click', () => {
            this.clearSearch();
        });

        this.getRoot().on('click', (e) => {
            // Hides search suggestions if the user clicks outside the search box.
            if (e.target !== this.searchBox[0] && e.target !== this.suggestionBox[0]) {
                this.hideSuggestionBox();
            }
        });

        this.searchButton.on('click', () => {
            this.search();
        });

        this.searchBox.on('keydown', (e) => {
            // Executes search if the user presses enter. Also removes focus from search.
            if (e.keyCode === KeyCodes.enter) {
                this.getModal().focus();
                this.search();
            }
        });

        this.suggestionBox.on(CustomEvents.events.activate, SELECTORS.SUGGESTION_ITEM, (e) => {
            const suggestionValue = $(e.target).attr('data-value');
            this.searchBox.val(suggestionValue);
            this.showSearchClear();
            this.getPage(suggestionValue);
        });
    }

    async initContent() {
        try {
            const topicList = await ModalHelpAjax.getTopicList(this.courseId);
            const landingPage = await ModalHelpAjax.getLandingPage(this.courseId, this.currentUrl);

            const renderPromise = Templates.render(TEMPLATES.MODAL_HELP_CONTENT, {html: landingPage.html});

            this.topicList = topicList;
            topicList.forEach(topic => this.topicIndex.add(topic.title));

            this.setBody(renderPromise);
        }
        catch(error) {
            console.error('error', error);
            Notification.exception(error);
        }
    }

    resetModal() {
        this.setBody('');
        this.searchBox.val('');
        this.suggestionBox.html('');
    }

    updateSearchBox() {
        const searchValue = this.searchBox.val();
        const topicIndex = this.topicIndex;
        const suggestionBox = this.suggestionBox;

        let suggestions = topicIndex.get(searchValue, topicIndex.values(), this.minSearchScore);
        if (Array.isArray(suggestions[0])) {
            suggestions = suggestions.map(suggestion => suggestion[1]);
        }

        this.suggestionBox.html('');
        const suggestionMarkup = suggestions.map((suggestion) => {
            return `<a href="#" class="modal-help-suggestion-item" data-value="${suggestion}">${suggestion}</a>`;
        });
        suggestionMarkup.forEach(markup => suggestionBox.append(markup));

        if (searchValue) {
            this.showSearchClear();
        }
        else {
            this.hideSearchClear();
        }

        this.showSuggestionBox();
    }

    clearSearch() {
        this.searchBox.val('');
        this.hideSearchClear();
    }

    async search() {
        const searchValue = this.searchBox.val();
        const topic = this.topicList.find(topic => topic.title.toLowerCase() === searchValue.toLowerCase());
        const url = topic.url.substr(topic.url.indexOf('/', 1));

        if (!searchValue) {
            return;
        }

        try {
            const guidePage = await ModalHelpAjax.getGuidePage(url);
            const renderPromise = Templates.render(TEMPLATES.MODAL_HELP_CONTENT, {html: guidePage.html});
            this.hideSuggestionBox();
            this.setBody(renderPromise);
        }
        catch (error) {
            console.error('error', error);
            Notification.exception(error);
        }
    }

    async getPage(topicName) {
        const topic = this.topicList.find(topic => topic.title.toLowerCase() === topicName.toLowerCase());
        const url = topic.url.substr(topic.url.indexOf('/', 1));
        try {
            const guidePage = await ModalHelpAjax.getGuidePage(url);
            const renderPromise = Templates.render(TEMPLATES.MODAL_HELP_CONTENT, {html: guidePage.html, title: guidePage.title});
            this.setBody(renderPromise);
        }
        catch (error) {
            console.error('error', error);
            Notification.exception(error);
        }
    }

    static getType() {
        return 'theme_urcourses_default-help';
    }

    showSuggestionBox() {
        this.suggestionBox.removeClass('d-none');
    }

    hideSuggestionBox() {
        this.suggestionBox.addClass('d-none');
    }

    showSearchClear() {
        this.searchClear.removeClass('d-none');
    }

    hideSearchClear() {
        this.searchClear.addClass('d-none');
    }

}

// Setup code for adding ModalHelp to the modal factory.
let registered = false;
if (!registered) {
    ModalRegistry.register(ModalHelp.getType(), ModalHelp, 'theme_urcourses_default/modal_help');
    registered = true;
}
